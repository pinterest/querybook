import certifi
import requests
import flask_login

from app.auth.oauth_auth import OAuthLoginManager, OAUTH_CALLBACK_PATH
from app.db import with_session, DBSession
from env import QuerybookSettings, get_env_config
from flask import Markup, request, session as flask_session, redirect
from lib.logger import get_logger
from lib.utils.decorators import in_mem_memoized
from logic.user import (
    get_user_by_name,
    create_user,
)
from .utils import AuthenticationError, abort_unauthorized, AuthUser

LOG = get_logger(__file__)


class NoopAuth(requests.auth.AuthBase):
    """
    This auth doesn't do anything.
    It only used to override oauthlib's behavior.
    """

    def __call__(self, r):
        return r


class OktaLoginManager(OAuthLoginManager):
    def get_oauth_urls(self):
        okta_base_url = get_env_config("OKTA_BASE_URL")
        authorization_url = f"{okta_base_url}/v1/authorize"
        token_url = f"{okta_base_url}/v1/token"
        profile_url = f"{okta_base_url}/v1/userinfo"
        return authorization_url, token_url, profile_url

    @property
    @in_mem_memoized()
    def oauth_config(self):
        authorization_url, token_url, profile_url = self.get_oauth_urls()

        return {
            "callback_url": "{}{}".format(
                QuerybookSettings.PUBLIC_URL, OAUTH_CALLBACK_PATH
            ),
            "client_id": QuerybookSettings.OAUTH_CLIENT_ID,
            "client_secret": QuerybookSettings.OAUTH_CLIENT_SECRET,
            "authorization_url": authorization_url,
            "token_url": token_url,
            "profile_url": profile_url,
            "scope": ["openid", "email", "profile"],
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

    def oauth_callback(self):
        LOG.debug("Handling Oauth callback...")

        if request.args.get("error"):
            return f"<h1>Error: { Markup.escape(request.args.get('error')) }</h1>"

        code = request.args.get("code")
        try:
            access_token = self._fetch_access_token(code)
            username, email, fullname = self._get_user_profile(access_token)
            with DBSession() as session:
                flask_login.login_user(
                    AuthUser(
                        self.login_user(username, email, fullname, session=session)
                    )
                )
        except AuthenticationError as e:
            LOG.error("Failed authenticate oauth user", e)
            abort_unauthorized()

        next_url = QuerybookSettings.PUBLIC_URL
        if "next" in flask_session:
            next_url = flask_session["next"]
            del flask_session["next"]

        return redirect(next_url)

    def _parse_user_profile(self, resp):
        user = resp.json()
        username = user["email"].split("@")[0]
        return username, user["email"], user["name"]

    @with_session
    def login_user(self, username, email, fullname, session=None):
        if not username or not isinstance(username, str):
            raise AuthenticationError("Please provide a valid username")

        user = get_user_by_name(username, session=session)
        if not user:
            user = create_user(
                username=username, fullname=fullname, email=email, session=session
            )
        return user


login_manager = OktaLoginManager()

ignore_paths = [OAUTH_CALLBACK_PATH]


def init_app(app):
    login_manager.init_app(app)


def login(request):
    return login_manager.login(request)
