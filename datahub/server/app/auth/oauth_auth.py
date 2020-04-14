# Copyright 2019 Pinterest, Inc
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import certifi
import requests


from flask import request, session as flask_session, redirect
import flask_login
from requests_oauthlib import OAuth2Session

from app.db import with_session, DBSession
from env import DataHubSettings
from lib.logger import get_logger
from logic.user import (
    get_user_by_name,
    create_user,
)
from .utils import (
    AuthenticationError,
    AuthUser,
    abort_unauthorized,
    DataHubLoginManager,
)

LOG = get_logger(__file__)

OAUTH_CALLBACK_PATH = "/oauth2callback"


class OAuthLoginManager(object):
    def __init__(self):
        self.login_manager = DataHubLoginManager()
        self.flask_app = None

    @property
    def oauth_session(self):
        return OAuth2Session(
            DataHubSettings.OAUTH_CLIENT_ID,
            scope="user",
            redirect_uri="{}{}".format(DataHubSettings.PUBLIC_URL, OAUTH_CALLBACK_PATH),
        )

    def init_app(self, flask_app):
        self.flask_app = flask_app

        self.login_manager.init_app(self.flask_app)
        self.flask_app.add_url_rule(
            OAUTH_CALLBACK_PATH, "oauth_callback", self.oauth_callback
        )

    def login(self, request):
        oauth_url, _ = self.oauth_session.authorization_url(
            DataHubSettings.OAUTH_AUTHORIZATION_URL
        )
        flask_session["next"] = request.path
        return redirect(oauth_url)

    def get_user_profile(self, access_token):
        resp = requests.get(
            DataHubSettings.OAUTH_USER_PROFILE, params={"access_token": access_token}
        )
        if not resp or resp.status_code != 200:
            raise AuthenticationError(
                "Failed to fetch user profile, status ({0})".format(
                    resp.status if resp else "None"
                )
            )
        user = resp.json()["user"]

        return user["username"], user["email"]

    @with_session
    def login_user(self, username, email, session=None):
        user = get_user_by_name(username, session=session)
        if not user:
            user = create_user(
                username=username, fullname=username, email=email, session=session
            )
        return user

    def oauth_callback(self):
        LOG.debug("Handling Oauth callback...")
        if request.args.get("error"):
            return f"<h1>Error: {request.args.get('error')}</h1>"

        resp = self.oauth_session.fetch_token(
            token_url=DataHubSettings.OAUTH_TOKEN_URL,
            client_id=DataHubSettings.OAUTH_CLIENT_ID,
            code=request.args.get("code"),
            client_secret=DataHubSettings.OAUTH_CLIENT_SECRET,
            cert=certifi.where(),
        )

        try:
            if resp is None:
                raise AuthenticationError("Null response, denying access.")

            access_token = resp["access_token"]

            username, email = self.get_user_profile(access_token)
        except AuthenticationError:
            abort_unauthorized()

        with DBSession() as session:
            flask_login.login_user(
                AuthUser(self.login_user(username, email, session=session))
            )

        next_url = "/"
        if "next" in flask_session:
            next_url = flask_session["next"]
            del flask_session["next"]

        return redirect(next_url)


login_manager = OAuthLoginManager()

ignore_paths = [OAUTH_CALLBACK_PATH]


def init_app(app):
    login_manager.init_app(app)


def login(request):
    return login_manager.login(request)
