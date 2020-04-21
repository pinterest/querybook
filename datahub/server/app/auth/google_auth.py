import requests
from app.auth.oauth_auth import OAuthLoginManager, OAUTH_CALLBACK_PATH
from env import DataHubSettings

GOOGLE_AUTH_CONFIG = "https://accounts.google.com/.well-known/openid-configuration"


class GoogleLoginManager(OAuthLoginManager):
    @property
    def oauth_config(self):
        if not hasattr(self, "_cached_google_config"):
            self._cached_google_config = requests.get(GOOGLE_AUTH_CONFIG).json()

        return {
            "callback_url": "{}{}".format(
                DataHubSettings.PUBLIC_URL, OAUTH_CALLBACK_PATH
            ),
            "client_id": DataHubSettings.OAUTH_CLIENT_ID,
            "client_secret": DataHubSettings.OAUTH_CLIENT_SECRET,
            "authorization_url": self._cached_google_config["authorization_endpoint"],
            "token_url": self._cached_google_config["token_endpoint"],
            "profile_url": self._cached_google_config["userinfo_endpoint"],
            "scope": [
                "https://www.googleapis.com/auth/userinfo.email",
                "openid",
                "https://www.googleapis.com/auth/userinfo.profile",
            ],
        }

    def _parse_user_profile(self, resp):
        user = resp.json()
        username = user["email"].split("@")[0]
        return username, user["email"]


login_manager = GoogleLoginManager()

ignore_paths = [OAUTH_CALLBACK_PATH]


def init_app(app):
    login_manager.init_app(app)


def login(request):
    return login_manager.login(request)
