from app.auth.oauth_auth import OAuthLoginManager, OAUTH_CALLBACK_PATH
from env import QuerybookSettings
from clients.google_client import get_google_oauth_config


class GoogleLoginManager(OAuthLoginManager):
    @property
    def oauth_config(self):
        google_config = get_google_oauth_config()

        return {
            "callback_url": "{}{}".format(
                QuerybookSettings.PUBLIC_URL, OAUTH_CALLBACK_PATH
            ),
            "client_id": QuerybookSettings.OAUTH_CLIENT_ID,
            "client_secret": QuerybookSettings.OAUTH_CLIENT_SECRET,
            "authorization_url": google_config["authorization_endpoint"],
            "token_url": google_config["token_endpoint"],
            "profile_url": google_config["userinfo_endpoint"],
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
