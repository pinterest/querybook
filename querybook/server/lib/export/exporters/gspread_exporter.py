from contextlib import contextmanager
import datetime
import re
from typing import Tuple

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
from lib.form import StructFormField, FormField


class UserTokenNotFound(Exception):
    pass


SCOPES = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
]

GSPREAD_OAUTH_CALLBACK = "/gspread_oauth2callback"


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
        return "Export Preview to Google Sheets"

    @property
    def exporter_type(self):
        return "url"

    @property
    def requires_auth(self):
        return True

    @property
    def export_form(self):
        return StructFormField(
            sheet_url=FormField(
                description="Optional, if not provided a new sheet will be created."
            ),
            worksheet_title=FormField(
                description='Defaults to "Sheet1"',
                helper="Title of the worksheet, if not found then a sheet will be created",
            ),
            start_cell=FormField(
                description="The top left cell position where data will be filled. Defaults to A1",
                regex="^[A-Z]{1,3}[1-9][0-9]*$",
            ),
        )

    def export(
        self,
        statement_execution_id,
        uid,
        sheet_url=None,
        worksheet_title="Sheet1",
        start_cell="A1",
    ):
        sheet = None
        try:
            credentials = self.get_credentials(uid)
            gc = gspread.authorize(credentials)
            with gspread_sheet(
                gc, sheet_url, f"Querybook Result {statement_execution_id}"
            ) as sheet:
                # Default case where only upload is needed
                if (
                    sheet_url is None
                    and worksheet_title == "Sheet1"
                    and start_cell == "A1"
                ):
                    self.upload_raw_csv_to_sheet(gc, sheet, statement_execution_id)
                else:
                    self.write_csv_to_sheet(
                        gc, sheet, statement_execution_id, worksheet_title, start_cell,
                    )

            return f"https://docs.google.com/spreadsheets/d/{sheet.id}"
        except RefreshError:
            # Invalidate user access token
            update_user_properties(current_user.id, gspread_token=None)
            # Continue to raise the error for the frontend client to see
            raise Exception("Invalid Google credentials, please try again.")

    def upload_raw_csv_to_sheet(
        self, gspread_client, sheet, statement_execution_id: int
    ):
        raw_csv = self._get_statement_execution_result(statement_execution_id, raw=True)
        gspread_client.import_csv(sheet.id, raw_csv.encode("utf-8"))

    def write_csv_to_sheet(
        self,
        gspread_client,
        sheet,
        statement_execution_id: int,
        worksheet_title: str,
        start_cell: str,
    ):
        csv = self._get_statement_execution_result(statement_execution_id)

        if len(csv):
            num_rows = len(csv)
            num_cols = len(csv[0])

            start_cell_coord = worksheet_coord_to_coord(start_cell)
            end_cell_coord = (
                start_cell_coord[0] + num_cols - 1,
                start_cell_coord[1] + num_rows - 1,
            )
            end_cell = coord_to_worksheet_coord(end_cell_coord[0], end_cell_coord[1])

            with gspread_worksheet(
                sheet, worksheet_title, end_cell_coord[0], end_cell_coord[1]
            ) as worksheet:

                worksheet.update("{}:{}".format(start_cell, end_cell), csv)

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
        num_col += (ord(ch) - ordAMinusOne) * (26 ** i)
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
def gspread_worksheet(sheet, worksheet_title, num_cols=26, num_rows=1000):
    worksheet = None
    num_cols = max(num_cols, 26)
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
