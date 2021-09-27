import requests

from app.auth.oauth_auth import OAuthLoginManager, OAUTH_CALLBACK_PATH
from env import QuerybookSettings, get_env_config
from .utils import AuthenticationError


class AzureLoginManager(OAuthLoginManager):
    @property
    def oauth_config(self):
        return {
            "callback_url": "{}{}".format(
                QuerybookSettings.PUBLIC_URL, OAUTH_CALLBACK_PATH
            ),
            "client_id": QuerybookSettings.OAUTH_CLIENT_ID,
            "client_secret": QuerybookSettings.OAUTH_CLIENT_SECRET,
            "authorization_url": "https://login.microsoftonline.com/{}/oauth2/v2.0/authorize".format(
                get_env_config("AZURE_TENANT_ID")
            ),
            "token_url": "https://login.microsoftonline.com/{}/oauth2/v2.0/token".format(
                get_env_config("AZURE_TENANT_ID")
            ),
            "profile_url": "https://graph.microsoft.com/oidc/userinfo",
            "scope": ["openid", "profile", "email", "User.Read"],
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
        return self._parse_user_profile(resp.json())

    def _parse_user_profile(self, user_info):
        return user_info["name"], user_info["email"]


login_manager = AzureLoginManager()

ignore_paths = [OAUTH_CALLBACK_PATH]


def init_app(app):
    login_manager.init_app(app)


def login(request):
    return login_manager.login(request)
