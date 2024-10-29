import certifi
from flask import session as flask_session, request
from app.auth.github_auth import GitHubLoginManager
from env import QuerybookSettings
from lib.logger import get_logger
from app.flask_app import flask_app
from typing import Optional, Dict, Any

LOG = get_logger(__file__)

GITHUB_OAUTH_CALLBACK = "/github/oauth2callback"
GITHUB_ACCESS_TOKEN = "github_access_token"


class GitHubManager(GitHubLoginManager):
    def __init__(
        self,
        additional_scopes: Optional[list] = None,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
    ):
        self.additional_scopes = additional_scopes or []
        self._client_id = client_id
        self._client_secret = client_secret
        super().__init__()

    @property
    def oauth_config(self) -> Dict[str, Any]:
        config = super().oauth_config
        config["scope"] = "user email " + " ".join(self.additional_scopes)
        config[
            "callback_url"
        ] = f"{QuerybookSettings.PUBLIC_URL}{GITHUB_OAUTH_CALLBACK}"
        if self._client_id:
            config["client_id"] = self._client_id
        if self._client_secret:
            config["client_secret"] = self._client_secret
        return config

    def save_github_token(self, token: str) -> None:
        flask_session[GITHUB_ACCESS_TOKEN] = token
        LOG.debug("Saved GitHub token to session")

    def get_github_token(self) -> Optional[str]:
        access_token = flask_session.get(GITHUB_ACCESS_TOKEN)
        if not access_token:
            LOG.error("GitHub OAuth token not found in session")
            raise Exception("GitHub OAuth token not found in session")
        return access_token

    def initiate_github_integration(self) -> Dict[str, str]:
        github = self.oauth_session
        authorization_url, state = github.authorization_url(
            self.oauth_config["authorization_url"]
        )
        flask_session["oauth_state"] = state
        return {"url": authorization_url}

    def github_integration_callback(self) -> str:
        try:
            github = self.oauth_session
            access_token = github.fetch_token(
                self.oauth_config["token_url"],
                client_secret=self._client_secret,
                authorization_response=request.url,
                cert=certifi.where(),
            )
            self.save_github_token(access_token["access_token"])
            return self.success_response()
        except Exception as e:
            LOG.error(f"Failed to obtain credentials: {e}")
            return self.error_response(str(e))

    def success_response(self) -> str:
        return """
            <p>Success! Please close the tab.</p>
            <script>
                window.opener.receiveChildMessage()
            </script>
        """

    def error_response(self, error_message: str) -> str:
        return f"""
            <p>Failed to obtain credentials, reason: {error_message}</p>
        """


github_manager = GitHubManager(
    additional_scopes=["repo"],
    client_id=QuerybookSettings.GITHUB_CLIENT_ID,
    client_secret=QuerybookSettings.GITHUB_CLIENT_SECRET,
)


@flask_app.route(GITHUB_OAUTH_CALLBACK)
def github_callback() -> str:
    return github_manager.github_integration_callback()
