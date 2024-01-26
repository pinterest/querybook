from contextlib import contextmanager
import datetime
from itertools import islice
import re
from typing import Generator, List, Tuple
from app.db import DBSession, with_session

from flask import request
from flask_login import current_user
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.exceptions import RefreshError
import gspread

# import requests

from app.flask_app import flask_app
from env import QuerybookSettings
from logic.user import get_user_by_id, update_user_properties
from lib.export.base_exporter import BaseExporter
from lib.form import StructFormField, FormField, FormFieldType
from logic.query_execution import (
    get_statement_execution_by_id,
    update_statement_execution,
)


class UserTokenNotFound(Exception):
    pass


SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
]

GSPREAD_OAUTH_CALLBACK = "/gspread_oauth2callback"

MAX_SHEETS_CELLS = 5000000
MAX_SHEETS_NEW_ROWS = 40000
DEFAULT_GSPREAD_NUM_COLS = 26

_google_flow = None


def create_google_flow(google_client_config):
    global _google_flow
    if _google_flow is None:
        _google_flow = Flow.from_client_config(
            google_client_config,
            scopes=SCOPES,
            redirect_uri="{}{}".format(
                QuerybookSettings.PUBLIC_URL, GSPREAD_OAUTH_CALLBACK
            ),
        )


@flask_app.route(GSPREAD_OAUTH_CALLBACK)
def gspread_oauth_call_back():
    try:
        code = request.args.get("code")
        token = _google_flow.fetch_token(code=code)
        update_user_properties(current_user.id, gspread_token=token)

    except Exception as e:
        return """
            Failed to obtain credentials, reason: {}
        """.format(
            str(e)
        )

    return """
        <p>Success! Please close the tab.</p>
        <script>
            window.opener.receiveChildMessage()
        </script>
    """


class GoogleSheetsExporter(BaseExporter):
    def __init__(self, google_client_config):
        super(GoogleSheetsExporter, self).__init__()
        self._google_client_config = google_client_config
        create_google_flow(google_client_config)

    @property
    def exporter_name(self):
        return "Export Result to Google Sheets"

    @property
    def exporter_type(self):
        return "url"

    @property
    def requires_auth(self):
        return True

    @property
    def export_form(self):
        return StructFormField(
            (
                "sheet_url",
                FormField(
                    description="Optional, if not provided a new sheet will be created."
                ),
            ),
            (
                "worksheet_title",
                FormField(
                    description='Defaults to "Sheet1"',
                    helper="Title of the worksheet, if not found then a sheet will be created",
                ),
            ),
            (
                "start_cell",
                FormField(
                    description="The top left cell position where data will be filled. Defaults to A1",
                    regex="^[A-Z]{1,3}[1-9][0-9]*$",
                ),
            ),
            (
                "clear_sheet",
                FormField(
                    field_type=FormFieldType.Boolean,
                    helper="If checked, the sheet will be cleared before writing the result",
                ),
            ),
        )

    @with_session
    def _get_max_rows(
        self, statement_execution_id, start_cell: str = "A1", session=None
    ):
        result_columns_len = self._get_statement_execution_num_cols(
            statement_execution_id,
            session=session,
        )
        start_cell_coord = worksheet_coord_to_coord(start_cell)
        sheet_start_coord = worksheet_coord_to_coord("A1")

        column_offset = start_cell_coord[0] - sheet_start_coord[0]
        row_offset = start_cell_coord[1] - sheet_start_coord[1]

        total_column_cells = max(
            result_columns_len + column_offset, DEFAULT_GSPREAD_NUM_COLS
        )

        max_result_rows = (
            (MAX_SHEETS_CELLS // total_column_cells)
            if total_column_cells != 0
            else MAX_SHEETS_CELLS
        )
        return max_result_rows - row_offset

    def _save_sheet_to_statement_meta(self, sheet_url: str, statement_id: int):
        statement_execution = get_statement_execution_by_id(statement_id)
        meta_info = (
            statement_execution.meta_info or ""
        ) + f"Google sheet url: {sheet_url}\n"
        update_statement_execution(statement_id, meta_info=meta_info)

    def export(
        self,
        statement_execution_id,
        uid,
        sheet_url=None,
        worksheet_title="Sheet1",
        start_cell="A1",
        clear_sheet=False,
    ):
        sheet = None
        try:
            credentials = self.get_credentials(uid)
            gc = gspread.authorize(credentials)
            with gspread_sheet(
                gc,
                sheet_url,
                f"Querybook Result {statement_execution_id}, {self._get_query_execution_url_by_statement_id(statement_execution_id, uid)}",
            ) as sheet:
                self.write_csv_to_sheet(
                    sheet,
                    statement_execution_id,
                    worksheet_title,
                    start_cell,
                    clear_sheet,
                )
            sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet.id}"
            self._save_sheet_to_statement_meta(sheet_url, statement_execution_id)
            return sheet_url
        except RefreshError:
            # Invalidate user access token
            update_user_properties(uid, gspread_token=None)
            # Continue to raise the error for the frontend client to see
            raise Exception("Invalid Google credentials, please try again.")

    def _update_worksheet(
        self,
        worksheet,
        start_cell,
        end_cell,
        csv: Generator[List[List[str]], None, None],
    ):
        curr_start_cell = start_cell
        while True:
            csv_chunk = list(islice(csv, MAX_SHEETS_NEW_ROWS))
            worksheet.update(
                "{}:{}".format(curr_start_cell, end_cell),
                csv_chunk,
                value_input_option="USER_ENTERED",
            )

            chunk_len = len(csv_chunk)
            if chunk_len < MAX_SHEETS_NEW_ROWS:
                break

            curr_col, curr_row = worksheet_coord_to_coord(curr_start_cell)
            curr_start_cell = coord_to_worksheet_coord(curr_col, curr_row + chunk_len)

    def write_csv_to_sheet(
        self,
        sheet,
        statement_execution_id: int,
        worksheet_title: str,
        start_cell: str,
        clear_sheet: bool,
    ):
        with DBSession() as session:
            max_rows = self._get_max_rows(
                statement_execution_id, start_cell=start_cell, session=session
            )

            num_rows = self._get_statement_execution_num_rows(
                statement_execution_id, session=session
            )
            num_cols = self._get_statement_execution_num_cols(
                statement_execution_id, session=session
            )

            start_cell_coord = worksheet_coord_to_coord(start_cell)
            end_cell_coord = (
                start_cell_coord[0] + num_cols - 1,
                start_cell_coord[1] + num_rows - 1,
            )
            end_cell = coord_to_worksheet_coord(end_cell_coord[0], end_cell_coord[1])

            with gspread_worksheet(
                sheet, worksheet_title, end_cell_coord[0], end_cell_coord[1]
            ) as worksheet:
                if clear_sheet:
                    worksheet.clear()
                csv = self._get_statement_execution_result_iter(
                    statement_execution_id, number_of_lines=max_rows, session=session
                )
                self._update_worksheet(worksheet, start_cell, end_cell, csv)

    def get_credentials(self, uid):
        user = get_user_by_id(uid)
        if not (user and "gspread_token" in user.properties):
            raise UserTokenNotFound()
        token = user.properties["gspread_token"]

        client_config = _google_flow.client_config
        credentials = Credentials(
            token["access_token"],
            refresh_token=token.get("refresh_token"),
            id_token=token.get("id_token"),
            token_uri=client_config.get("token_uri"),
            client_id=client_config.get("client_id"),
            client_secret=client_config.get("client_secret"),
            scopes=SCOPES,
        )

        credentials.expiry = datetime.datetime.utcfromtimestamp(token["expires_at"])

        return credentials

    def acquire_auth(self, uid: int):
        try:
            self.get_credentials(uid)
            return None
        except UserTokenNotFound:
            # If user token is not found, go through the oauth process
            auth_url, _ = _google_flow.authorization_url(
                access_type="offline", prompt="consent"
            )
            return auth_url


ordAMinusOne = ord("A") - 1


def worksheet_coord_to_coord(worksheet_coord: str) -> Tuple[int, int]:
    match = re.match(r"^([A-Za-z]+)([1-9][0-9]*)$", worksheet_coord)
    col = match.group(1).upper()
    row = match.group(2)

    num_row = int(row)

    num_col = 0
    for i, ch in enumerate(reversed(col)):
        num_col += (ord(ch) - ordAMinusOne) * (26**i)
    return num_col, num_row


def coord_to_worksheet_coord(col: int, row: int) -> str:
    str_row = str(row)
    str_col = ""
    while col > 0:
        col, remainder = divmod(col, 26)
        if remainder == 0:
            remainder = 26
            col -= 1
        str_col = chr(ordAMinusOne + remainder) + str_col
    return str_col + str_row


@contextmanager
def gspread_sheet(gspread_client, sheet_url: str = None, sheet_name: str = ""):
    """Opens the sheet if sheet_url exists, otherwise create a new sheet
       with the given sheet name

    Args:
        gspread_client: gspread.Client
        sheet_url (str, optional): The url to the existing sheet. Defaults to None.
        sheet_name (str, optional): The name assigned to the newly created sheet. Defaults to ''.

    Yields:
        sheet: gspread sheet
    """
    sheet = None
    try:
        sheet = (
            gspread_client.create(sheet_name)
            if sheet_url is None
            else gspread_client.open_by_url(sheet_url)
        )
        yield sheet

        return
    except Exception as e:
        if sheet_url is None and sheet is not None:
            gspread_client.del_spreadsheet(sheet.id)
        raise e


@contextmanager
def gspread_worksheet(
    sheet, worksheet_title, num_cols=DEFAULT_GSPREAD_NUM_COLS, num_rows=1000
):
    worksheet = None
    num_cols = max(num_cols, DEFAULT_GSPREAD_NUM_COLS)
    num_rows = max(num_rows, 1000)
    try:
        worksheet = sheet.worksheet(worksheet_title)

        # Resize sheet to be at least the size of rows and cols
        if worksheet.row_count < num_rows:
            worksheet.add_rows(num_rows - worksheet.row_count)
        if worksheet.col_count < num_cols:
            worksheet.add_cols(num_cols - worksheet.col_count)
    except gspread.exceptions.WorksheetNotFound:
        worksheet = sheet.add_worksheet(worksheet_title, num_rows, num_cols)

    yield worksheet
