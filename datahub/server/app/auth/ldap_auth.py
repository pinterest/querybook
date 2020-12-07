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
import re

import ldap
import flask_login

from flask_login import current_user
from env import SiteSettings
from app.db import with_session, DBSession
from .utils import AuthenticationError, AuthUser, DataHubLoginManager
from logic.user import (
    get_user_by_name,
    create_user,
)

login_manager = DataHubLoginManager()


def get_transformed_username(username):
    dn = None
    if username.startswith("uid="):
        dn = username

        match = re.match(r"^uid=([^,]+)", username)
        username = match.group(1)
    else:
        dn = SiteSettings.LDAP_USER_DN.format(username)
    return username, dn


@with_session
def authenticate(username, password, session=None):
    if not username or not password:
        raise AuthenticationError()

    conn = ldap.initialize(SiteSettings.LDAP_CONN)
    conn.set_option(ldap.OPT_REFERRALS, 0)

    try:
        if username.startswith("uid="):
            dn = username
        else:
            dn = SiteSettings.LDAP_USER_DN.format(username)
        conn.simple_bind_s(dn, password)
    except ldap.INVALID_CREDENTIALS:
        raise AuthenticationError("User does not exist or wrong password")
    return True


@with_session
def login_user(username, session=None):
    user = get_user_by_name(username, session=session)
    if not user:
        user = create_user(username=username, fullname=username, session=session)
    return user


def login_user_endpoint(username, password):
    if current_user.is_authenticated:
        return

    username, dn = get_transformed_username(username)

    if authenticate(dn, password):
        with DBSession() as session:
            user = login_user(username, session=session)
            flask_login.login_user(AuthUser(user))
            return user


def init_app(app):
    login_manager.init_app(app)


def login(request):
    # The webapp will handle the UI for logging in
    pass
