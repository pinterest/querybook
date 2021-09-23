import os
import requests
from app.auth.oauth_auth import OAuthLoginManager, OAUTH_CALLBACK_PATH
from env import QuerybookSettings

from .utils import AuthenticationError

# Relevant github issue https://github.com/singingwolfboy/flask-dance/issues/235
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"


class GitHubLoginManager(OAuthLoginManager):
    @property
    def oauth_config(self):
        return {
            "callback_url": "{}{}".format(
                QuerybookSettings.PUBLIC_URL, OAUTH_CALLBACK_PATH
            ),
            "client_id": QuerybookSettings.OAUTH_CLIENT_ID,
            "client_secret": QuerybookSettings.OAUTH_CLIENT_SECRET,
            "authorization_url": "https://github.com/login/oauth/authorize",
            "token_url": "https://github.com/login/oauth/access_token",
            "profile_url": "https://api.github.com/user",
            "scope": "user:email",
        }

    def _get_user_profile(self, access_token):
        resp = requests.get(
            self.oauth_config["profile_url"],
            headers={"Authorization": "Bearer {}".format(access_token)},
        )
        if not resp or resp.status_code != 200:
            raise AuthenticationError(
                "Failed to fetch user profile, status ({0})".format(
                    resp.status if resp else "None"
                )
            )
        return self._parse_user_profile(resp)

    def _parse_user_profile(self, resp):
        user = resp.json()

        email = user["email"]
        username = user["login"]
        return username, email


login_manager = GitHubLoginManager()
ignore_paths = [OAUTH_CALLBACK_PATH]


def init_app(app):
    login_manager.init_app(app)


def login(request):
    return login_manager.login(request)
