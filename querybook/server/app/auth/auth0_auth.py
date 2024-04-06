from env import get_env_config

from app.auth.okta_auth import OAUTH_CALLBACK_PATH, OktaLoginManager


class Auth0LoginManager(OktaLoginManager):
    def get_oauth_urls(self):
        auth0_base_url = get_env_config("AUTH0_BASE_URL")
        authorization_url = f"{auth0_base_url}/authorize"
        token_url = f"{auth0_base_url}/oauth/token"
        profile_url = f"{auth0_base_url}/userinfo"
        return authorization_url, token_url, profile_url


login_manager = Auth0LoginManager()

ignore_paths = [OAUTH_CALLBACK_PATH]


def init_app(app):
    login_manager.init_app(app)


def login(request):
    return login_manager.login(request)
