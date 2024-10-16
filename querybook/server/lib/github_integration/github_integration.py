import certifi
from flask import session as flask_session, request
from app.auth.github_auth import GitHubLoginManager
from env import QuerybookSettings
from lib.logger import get_logger
from app.flask_app import flask_app
from typing import Optional, Dict, Any

LOG = get_logger(__file__)


GITHUB_OAUTH_CALLBACK = "/github/oauth2callback"


class GitHubIntegrationManager(GitHubLoginManager):
    def __init__(self, additional_scopes: Optional[list] = None):
        self.additional_scopes = additional_scopes or []
        super().__init__()

    @property
    def oauth_config(self) -> Dict[str, Any]:
        config = super().oauth_config
        config["scope"] = "user email " + " ".join(self.additional_scopes)
        config[
            "callback_url"
        ] = f"{QuerybookSettings.PUBLIC_URL}{GITHUB_OAUTH_CALLBACK}"
        return config

    def save_github_token(self, token: str) -> None:
        flask_session["github_access_token"] = token
        LOG.debug("Saved GitHub token to session")

    def get_github_token(self) -> Optional[str]:
        return flask_session.get("github_access_token")

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
                client_secret=self.oauth_config["client_secret"],
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


def get_github_manager() -> GitHubIntegrationManager:
    return GitHubIntegrationManager(additional_scopes=["repo"])


@flask_app.route(GITHUB_OAUTH_CALLBACK)
def github_callback() -> str:
    github_manager = get_github_manager()
    return github_manager.github_integration_callback()


# Test GitHub OAuth Flow
def main():
    github_manager = GitHubIntegrationManager()
    oauth_config = github_manager.oauth_config
    client_id = oauth_config["client_id"]
    client_secret = oauth_config["client_secret"]

    from requests_oauthlib import OAuth2Session

    github = OAuth2Session(client_id)
    authorization_url, state = github.authorization_url(
        oauth_config["authorization_url"]
    )
    print("Please go here and authorize,", authorization_url)

    redirect_response = input("Paste the full redirect URL here:")
    github.fetch_token(
        oauth_config["token_url"],
        client_secret=client_secret,
        authorization_response=redirect_response,
    )

    user_profile = github.get(oauth_config["profile_url"]).json()
    print(user_profile)


if __name__ == "__main__":
    main()
