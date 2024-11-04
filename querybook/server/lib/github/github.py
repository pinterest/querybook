import certifi
from flask import session as flask_session, request
from github import Github, Auth
from app.auth.github_auth import GitHubLoginManager
from app.auth.utils import AuthenticationError
from env import QuerybookSettings
from lib.logger import get_logger
from app.flask_app import flask_app
from typing import Optional, Dict, Any
from .crypto_utils import DecryptionError, encrypt_token, decrypt_token
from flask_login import current_user
from logic.user import get_user_by_id, update_user_properties

LOG = get_logger(__file__)

GITHUB_OAUTH_CALLBACK = "/github/oauth2callback"
GITHUB_ACCESS_TOKEN = "github_access_token"
OAUTH_STATE_KEY = "oauth_state"


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
        encrypted_token = encrypt_token(token)
        user = get_user_by_id(current_user.id)
        if user:
            try:
                update_user_properties(user.id, github_access_token=encrypted_token)
                LOG.debug("Saved encrypted GitHub token to user properties")
            except Exception as e:
                LOG.error(f"Failed to update user properties: {e}")
                raise AuthenticationError("Failed to save GitHub token")
        else:
            LOG.error("User not found when saving GitHub token")
            raise AuthenticationError("User not found")

    def get_github_token(self) -> str:
        user = get_user_by_id(current_user.id)
        if not user:
            LOG.error("User not found when retrieving GitHub token")
            raise AuthenticationError("User not found")

        encrypted_token = user.properties.get(GITHUB_ACCESS_TOKEN)
        if not encrypted_token:
            LOG.error("GitHub OAuth token not found in user properties")
            raise AuthenticationError("GitHub OAuth token not found")

        try:
            token = decrypt_token(encrypted_token)
            return self.validate_token(token)
        except DecryptionError as e:
            LOG.error(f"Failed to decrypt and validate GitHub token: {e}")
            self.invalidate_token(user)
            raise AuthenticationError("Invalid GitHub token failure.")

    def validate_token(self, token: str) -> str:
        try:
            auth = Auth.Token(token)
            github_client = Github(auth=auth)
            github_user = github_client.get_user()
            if github_user and github_user.login:
                LOG.debug(f"Validated GitHub token for user: {github_user.login}")
                return token
            else:
                LOG.error("GitHub token validation failed: User login not found")
                raise AuthenticationError("GitHub token validation failed.")
        except Exception as e:
            LOG.error(f"GitHub API error during token validation: {e}")
            raise AuthenticationError("GitHub API error during token validation.")

    def invalidate_token(self, user):
        try:
            update_user_properties(user.id, github_access_token=None)
            LOG.debug(
                f"Removed GitHub token for user '{user.get_name()}' (ID: {user.id})."
            )
        except Exception as db_error:
            LOG.error(
                f"Failed to remove GitHub token for user '{user.get_name()}' (ID: {user.id}): {db_error}"
            )

    def initiate_github_integration(self) -> Dict[str, str]:
        github = self.oauth_session
        authorization_url, state = github.authorization_url(
            self.oauth_config["authorization_url"]
        )
        flask_session[OAUTH_STATE_KEY] = state
        return {"url": authorization_url}

    def github_integration_callback(self) -> str:
        try:
            github = self.oauth_session

            github_state = flask_session.pop(OAUTH_STATE_KEY, None)
            # Validate the state parameter to protect against CSRF attacks
            if github_state is None or github_state != request.args.get("state"):
                raise AuthenticationError("Invalid state parameter")

            access_token = github.fetch_token(
                self.oauth_config["token_url"],
                client_secret=self.oauth_config["client_secret"],
                authorization_response=request.url,
                cert=certifi.where(),
            )
            token = access_token["access_token"]
            self.save_github_token(token)
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
