import io
import os
from itertools import islice
from typing import Generator, List, Optional, Tuple
from urllib.parse import urlparse

import msal
import openpyxl
import requests
from flask import request as flask_request
from flask_login import current_user

from app.flask_app import flask_app
from env import QuerybookSettings
from lib.export.base_exporter import BaseExporter
from lib.form import FormField, StructFormField
from lib.logger import get_logger
from logic.query_execution import (
    get_statement_execution_by_id,
    update_statement_execution,
)
from logic.user import get_user_by_id, update_user_properties

LOG = get_logger(__file__)

GRAPH_API_BASE = "https://graph.microsoft.com/v1.0"
SHAREPOINT_OAUTH_CALLBACK = "/sharepoint_oauth2callback"

SCOPES = [
    "https://graph.microsoft.com/Files.ReadWrite",
    "https://graph.microsoft.com/Sites.ReadWrite.All",
    "offline_access",
]

MAX_ROWS_PER_BATCH = 1000


class UserTokenNotFound(Exception):
    pass


class SharePointExporter(BaseExporter):
    """Export query results to a SharePoint or OneDrive Excel workbook.

    Requires an Azure AD app registration with:
        SHAREPOINT_CLIENT_ID     — Azure AD application (client) ID
        SHAREPOINT_TENANT_ID     — Azure AD tenant ID, or "common" for multi-tenant
        SHAREPOINT_CLIENT_SECRET — Client secret
    """

    def __init__(self):
        super().__init__()
        self._client_id = os.environ.get("SHAREPOINT_CLIENT_ID")
        self._tenant_id = os.environ.get("SHAREPOINT_TENANT_ID", "common")
        self._client_secret = os.environ.get("SHAREPOINT_CLIENT_SECRET")
        self._authority = f"https://login.microsoftonline.com/{self._tenant_id}"

    @property
    def exporter_name(self):
        return "Export Result to SharePoint Excel"

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
                "workbook_name",
                FormField(
                    description="Excel filename (e.g. results.xlsx). Created if it doesn't exist.",
                    helper="The file is saved to your OneDrive root, or to the SharePoint folder specified below.",
                ),
            ),
            (
                "worksheet_name",
                FormField(
                    description='Worksheet tab name. Defaults to "Sheet1".',
                ),
            ),
            (
                "sharepoint_site_url",
                FormField(
                    description="Optional SharePoint site URL (e.g. https://contoso.sharepoint.com/sites/myteam). Leave blank to use your OneDrive.",
                ),
            ),
            (
                "folder_path",
                FormField(
                    description="Optional folder path within the drive (e.g. Documents/Reports). Leave blank for root.",
                ),
            ),
        )

    # ------------------------------------------------------------------ #
    # Auth                                                                 #
    # ------------------------------------------------------------------ #

    def _msal_app(self, cache: msal.SerializableTokenCache = None):
        return msal.ConfidentialClientApplication(
            self._client_id,
            authority=self._authority,
            client_credential=self._client_secret,
            token_cache=cache,
        )

    def acquire_auth(self, uid: int) -> Optional[str]:
        try:
            self._get_access_token(uid)
            return None
        except UserTokenNotFound:
            redirect_uri = f"{QuerybookSettings.PUBLIC_URL}{SHAREPOINT_OAUTH_CALLBACK}"
            auth_url = self._msal_app().get_authorization_request_url(
                SCOPES,
                redirect_uri=redirect_uri,
                state=str(uid),
            )
            return auth_url

    def _get_access_token(self, uid: int) -> str:
        user = get_user_by_id(uid)
        if not (user and "sharepoint_token" in (user.properties or {})):
            raise UserTokenNotFound()

        cache = msal.SerializableTokenCache()
        cache.deserialize(user.properties["sharepoint_token"])

        app = self._msal_app(cache)
        accounts = app.get_accounts()
        if not accounts:
            raise UserTokenNotFound()

        result = app.acquire_token_silent(SCOPES, account=accounts[0])
        if not result or "access_token" not in result:
            raise UserTokenNotFound()

        if cache.has_state_changed:
            update_user_properties(uid, sharepoint_token=cache.serialize())

        return result["access_token"]

    # ------------------------------------------------------------------ #
    # Graph API helpers                                                    #
    # ------------------------------------------------------------------ #

    def _auth_headers(self, token: str) -> dict:
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def _graph_get(self, token: str, url: str) -> dict:
        resp = requests.get(url, headers=self._auth_headers(token))
        resp.raise_for_status()
        return resp.json()

    def _graph_patch(self, token: str, url: str, body: dict) -> dict:
        resp = requests.patch(url, headers=self._auth_headers(token), json=body)
        resp.raise_for_status()
        return resp.json()

    def _graph_post(self, token: str, url: str, body: dict) -> dict:
        resp = requests.post(url, headers=self._auth_headers(token), json=body)
        resp.raise_for_status()
        return resp.json()

    # ------------------------------------------------------------------ #
    # Drive resolution                                                     #
    # ------------------------------------------------------------------ #

    def _resolve_drive_root(self, token: str, sharepoint_site_url: str = None) -> str:
        """Return the Graph API base URL for the target drive."""
        if sharepoint_site_url:
            parsed = urlparse(sharepoint_site_url)
            hostname = parsed.hostname
            site_path = parsed.path.rstrip("/")
            site = self._graph_get(
                token, f"{GRAPH_API_BASE}/sites/{hostname}:{site_path}"
            )
            return f"{GRAPH_API_BASE}/sites/{site['id']}/drive"
        return f"{GRAPH_API_BASE}/me/drive"

    def _get_or_create_workbook(
        self, token: str, drive_root: str, folder_path: str, workbook_name: str
    ) -> Tuple[str, str]:
        """Return (item_id, web_url), creating the workbook if it doesn't exist."""
        if not workbook_name.endswith(".xlsx"):
            workbook_name += ".xlsx"

        file_path = (
            f"{folder_path.strip('/')}/{workbook_name}" if folder_path else workbook_name
        )
        content_url = f"{drive_root}/root:/{file_path}:/content"

        # Try to fetch existing item metadata
        meta_url = f"{drive_root}/root:/{file_path}"
        try:
            existing = self._graph_get(token, meta_url)
            return existing["id"], existing.get("webUrl", "")
        except requests.HTTPError as exc:
            if exc.response.status_code != 404:
                raise

        # Create a minimal empty .xlsx
        wb = openpyxl.Workbook()
        buf = io.BytesIO()
        wb.save(buf)
        buf.seek(0)

        resp = requests.put(
            content_url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": (
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                ),
            },
            data=buf.read(),
        )
        resp.raise_for_status()
        data = resp.json()
        return data["id"], data.get("webUrl", "")

    def _ensure_worksheet(
        self, token: str, drive_root: str, item_id: str, worksheet_name: str
    ):
        sheets_url = f"{drive_root}/items/{item_id}/workbook/worksheets"
        sheets = self._graph_get(token, sheets_url).get("value", [])
        if not any(s["name"] == worksheet_name for s in sheets):
            self._graph_post(token, sheets_url, {"name": worksheet_name})

    def _write_rows(
        self,
        token: str,
        drive_root: str,
        item_id: str,
        worksheet_name: str,
        rows: Generator[List[List[str]], None, None],
    ):
        row_offset = 0
        while True:
            chunk = list(islice(rows, MAX_ROWS_PER_BATCH))
            if not chunk:
                break

            num_cols = len(chunk[0]) if chunk else 1
            num_rows = len(chunk)
            start_row = row_offset + 1
            end_row = row_offset + num_rows
            address = f"A{start_row}:{_col_index_to_letter(num_cols)}{end_row}"

            range_url = (
                f"{drive_root}/items/{item_id}/workbook/worksheets"
                f"/{worksheet_name}/range(address='{address}')"
            )
            self._graph_patch(token, range_url, {"values": chunk})

            row_offset += num_rows
            if num_rows < MAX_ROWS_PER_BATCH:
                break

    # ------------------------------------------------------------------ #
    # Export entrypoint                                                    #
    # ------------------------------------------------------------------ #

    def export(
        self,
        statement_execution_id: int,
        uid: int,
        workbook_name: str = "querybook_result",
        worksheet_name: str = "Sheet1",
        sharepoint_site_url: str = None,
        folder_path: str = None,
    ) -> str:
        token = self._get_access_token(uid)
        drive_root = self._resolve_drive_root(token, sharepoint_site_url)
        item_id, web_url = self._get_or_create_workbook(
            token, drive_root, folder_path, workbook_name
        )
        self._ensure_worksheet(token, drive_root, item_id, worksheet_name)

        rows = self._get_statement_execution_result_iter(statement_execution_id)
        self._write_rows(token, drive_root, item_id, worksheet_name, rows)

        statement_execution = get_statement_execution_by_id(statement_execution_id)
        meta_info = (
            statement_execution.meta_info or ""
        ) + f"SharePoint URL: {web_url}\n"
        update_statement_execution(statement_execution_id, meta_info=meta_info)

        return web_url


# ------------------------------------------------------------------ #
# OAuth2 callback route                                               #
# ------------------------------------------------------------------ #


@flask_app.route(SHAREPOINT_OAUTH_CALLBACK)
def sharepoint_oauth_callback():
    try:
        code = flask_request.args.get("code")
        uid = int(flask_request.args.get("state"))
        redirect_uri = f"{QuerybookSettings.PUBLIC_URL}{SHAREPOINT_OAUTH_CALLBACK}"

        cache = msal.SerializableTokenCache()
        app = msal.ConfidentialClientApplication(
            os.environ.get("SHAREPOINT_CLIENT_ID"),
            authority=f"https://login.microsoftonline.com/{os.environ.get('SHAREPOINT_TENANT_ID', 'common')}",
            client_credential=os.environ.get("SHAREPOINT_CLIENT_SECRET"),
            token_cache=cache,
        )
        result = app.acquire_token_by_authorization_code(
            code,
            scopes=SCOPES,
            redirect_uri=redirect_uri,
        )
        if "error" in result:
            return f"Authentication failed: {result.get('error_description', result['error'])}"

        update_user_properties(uid, sharepoint_token=cache.serialize())
    except Exception as exc:
        return f"Failed to obtain credentials: {exc}"

    return """
        <p>Success! Please close this tab.</p>
        <script>
            window.opener.receiveChildMessage()
        </script>
    """


# ------------------------------------------------------------------ #
# Utility                                                             #
# ------------------------------------------------------------------ #


def _col_index_to_letter(col: int) -> str:
    """Convert 1-based column index to Excel column letter (1→A, 27→AA)."""
    result = ""
    while col > 0:
        col, rem = divmod(col - 1, 26)
        result = chr(65 + rem) + result
    return result
