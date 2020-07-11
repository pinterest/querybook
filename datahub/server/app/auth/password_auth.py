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

# This is based on Airflow's user password model
import flask_login
from flask_login import current_user

from app.db import with_session, DBSession

from logic.user import get_user_by_name, create_user
from .utils import AuthenticationError, AuthUser, DataHubLoginManager


login_manager = DataHubLoginManager()


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
    if not username or not password:
        raise AuthenticationError()

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
