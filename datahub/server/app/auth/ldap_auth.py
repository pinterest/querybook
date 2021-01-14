import re

import ldap
import flask_login

from flask_login import current_user
from env import DataHubSettings
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
        dn = DataHubSettings.LDAP_USER_DN.format(username)
    return username, dn


@with_session
def authenticate(username, password, session=None):
    if not username or not password:
        raise AuthenticationError()

    conn = ldap.initialize(DataHubSettings.LDAP_CONN)
    conn.set_option(ldap.OPT_REFERRALS, 0)

    try:
        if username.startswith("uid="):
            dn = username
        else:
            dn = DataHubSettings.LDAP_USER_DN.format(username)
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
