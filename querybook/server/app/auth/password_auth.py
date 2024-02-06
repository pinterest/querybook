# This is based on Airflow's user password model

import flask_login
from flask_login import current_user

from app.db import with_session, DBSession

from logic.user import get_user_by_name, create_user
from .utils import AuthenticationError, AuthUser, QuerybookLoginManager


login_manager = QuerybookLoginManager()


@with_session
def authenticate(username, password, session=None):
    """
    Authenticate a PasswordUser with the specified
    username/password.

    :param username: The username
    :param password: The password
    :param session: An active SQLAlchemy session


    :raise AuthenticationError: if an error occurred
    :return: a PasswordUser
    """
    if not username or not isinstance(username, str):
        raise AuthenticationError("Please provide a valid username")

    if not password:
        raise AuthenticationError("Please provide a password")

    user = get_user_by_name(username, session=session)
    if not user:
        raise AuthenticationError("User does not exist or wrong password")

    if not user.check_password(password):
        raise AuthenticationError("User does not exist or wrong password")

    return AuthUser(user)


def login_user_endpoint(username, password):
    if current_user.is_authenticated:
        return

    with DBSession() as session:
        user = authenticate(username, password, session=session)
        flask_login.login_user(user)

        return user


def signup_user_endpoint(username, password, email):
    with DBSession() as session:
        user = create_user(
            username=username, password=password, email=email, session=session
        )
        flask_login.login_user(AuthUser(user))

        return user


def init_app(app):
    login_manager.init_app(app)


def login(request):
    # The webapp will handle the UI for logging in
    pass
