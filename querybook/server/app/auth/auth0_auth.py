from env import get_env_config
import certifi

from app.auth.okta_auth import OAUTH_CALLBACK_PATH, OktaLoginManager
from .utils import AuthenticationError


class Auth0LoginManager(OktaLoginManager):
    def get_oauth_urls(self):
        auth0_base_url = get_env_config("AUTH0_BASE_URL")
        authorization_url = f"{auth0_base_url}/authorize"
        token_url = f"{auth0_base_url}/oauth/token"
        profile_url = f"{auth0_base_url}/userinfo"
        return authorization_url, token_url, profile_url

    def _fetch_access_token(self, code):
        resp = self.oauth_session.fetch_token(
            token_url=self.oauth_config["token_url"],
            client_id=self.oauth_config["client_id"],
            code=code,
            client_secret=self.oauth_config["client_secret"],
            cert=certifi.where(),
        )

        if resp is None:
            raise AuthenticationError("Null response, denying access.")
        return resp["access_token"]



login_manager = Auth0LoginManager()

ignore_paths = [OAUTH_CALLBACK_PATH]


def init_app(app):
    login_manager.init_app(app)


def login(request):
    return login_manager.login(request)
