from flask import request
from flask_login import logout_user, current_user

from const.path import BUILD_PATH
from const.datasources import DS_PATH
from env import QuerybookSettings
from lib.utils.import_helper import import_module_with_default


auth = None
login_config = None


def init_app(flask_app):
    load_auth()

    global auth
    auth.init_app(flask_app)

    @flask_app.before_request
    def check_auth():
        ignore_paths = ["/ping/"] + getattr(auth, "ignore_paths", [])

        if request.path in ignore_paths:
            return
        # API LOGIC and Static File are handled differently
        if request.path.startswith(DS_PATH) or request.path.startswith(BUILD_PATH):
            return
        if not current_user.is_authenticated:
            return auth.login(request)

    check_auth  # PYLINT :(


def load_auth():
    global auth
    auth = import_module_with_default(QuerybookSettings.AUTH_BACKEND)
    get_login_config()


def logout():
    logout_user()


def get_login_config():
    from app.datasource import register

    global auth
    global login_config
    if login_config is None:
        oauth_url = ""
        has_login = hasattr(auth, "login_user_endpoint")
        has_signup = hasattr(auth, "signup_user_endpoint")
        has_oauth_url = hasattr(auth, "oauth_authorization_url")

        if has_login:
            register("/login/", methods=["POST"], require_auth=False)(
                auth.login_user_endpoint
            )

        if has_signup:
            register("/signup/", methods=["POST"], require_auth=False)(
                auth.signup_user_endpoint
            )

        if has_oauth_url:
            oauth_url = auth.oauth_authorization_url()

        login_config = {
            "has_login": has_login,
            "has_signup": has_signup,
            "oauth_url": oauth_url,
        }
    return login_config
