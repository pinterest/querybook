import certifi
import requests

from app.auth.oauth_auth import OAuthLoginManager, OAUTH_CALLBACK_PATH
from env import QuerybookSettings, get_env_config
from lib.utils.decorators import in_mem_memoized
from .utils import AuthenticationError


class NoopAuth(requests.auth.AuthBase):
    def __call__(self, r):
        # Implement my authentication
        return r


class OktaLoginManager(OAuthLoginManager):
    def get_okta_urls(self):
        okta_base_url = get_env_config("OKTA_BASE_URL")
        authorization_url = f"{okta_base_url}/v1/authorize"
        token_url = f"{okta_base_url}/v1/token"
        profile_url = f"{okta_base_url}/v1/userinfo"
        return authorization_url, token_url, profile_url

    @property
    @in_mem_memoized()
    def oauth_config(self):
        authorization_url, token_url, profile_url = self.get_okta_urls()

        return {
            "callback_url": "{}{}".format(
                QuerybookSettings.PUBLIC_URL, OAUTH_CALLBACK_PATH
            ),
            "client_id": QuerybookSettings.OAUTH_CLIENT_ID,
            "client_secret": QuerybookSettings.OAUTH_CLIENT_SECRET,
            "authorization_url": authorization_url,
            "token_url": token_url,
            "profile_url": profile_url,
            "scope": ["openid", "email"],
        }

    def _fetch_access_token(self, code):
        resp = self.oauth_session.fetch_token(
            token_url=self.oauth_config["token_url"],
            client_id=self.oauth_config["client_id"],
            code=code,
            client_secret=self.oauth_config["client_secret"],
            cert=certifi.where(),
            # This Authentication is needed because Okta would throw error
            # about passing client_secret and client_id in request.header
            # which is the default behavior of oauthlib
            auth=NoopAuth(),
        )
        if resp is None:
            raise AuthenticationError("Null response, denying access.")
        return resp["access_token"]

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
        username = user["email"].split("@")[0]
        return username, user["email"]


login_manager = OktaLoginManager()

ignore_paths = [OAUTH_CALLBACK_PATH]


def init_app(app):
    login_manager.init_app(app)


def login(request):
    return login_manager.login(request)
