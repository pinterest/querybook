import flask
from flask_login import UserMixin, LoginManager
from flask import abort, session as flask_session

from app.db import with_session
from const.datasources import ACCESS_RESTRICTED_STATUS_CODE, UNAUTHORIZED_STATUS_CODE
from const.user_roles import UserRoleType

# from lib.utils.decorators import in_mem_memoized
from models.user import User
from app.db import DBSession, get_session
from logic.admin import get_api_access_token
from logic.environment import get_all_accessible_environment_ids_by_uid
from logic.user import get_user_by_id


class AuthenticationError(Exception):
    pass


class AuthUser(UserMixin):
    def __init__(self, user: User):
        self._user_dict = user.to_dict(with_roles=True)

    @property
    def id(self):
        return self._user_dict["id"]

    def get_id(self):
        return str(self.id)

    @property
    def is_admin(self):
        return UserRoleType.ADMIN.value in self._user_dict["roles"]

    @property
    # @in_mem_memoized(300)
    def environment_ids(self):
        return get_all_accessible_environment_ids_by_uid(self.id, session=get_session())


class QuerybookLoginManager(LoginManager):
    def __init__(self, *args, **kwargs):
        super(QuerybookLoginManager, self).__init__(*args, **kwargs)

        self.request_loader(load_user_with_api_access_token)
        self.user_loader(load_user)
        self.needs_refresh_message = (
            "To protect your account, please reauthenticate to access this page."
        )
        self.needs_refresh_message_category = "info"


@with_session
def load_user(uid, session=None):
    if not uid or uid == "None":
        return None
    user = get_user_by_id(uid, session=session)
    if user is None:
        # Invalid user, clear session
        flask_session.clear()
        flask.abort(UNAUTHORIZED_STATUS_CODE, description="Invalid cookie")

    return AuthUser(user)


def load_user_with_api_access_token(request):
    token_string = request.headers.get("api-access-token")
    if token_string:
        with DBSession() as session:
            token_validation = get_api_access_token(token_string)
            if token_validation:
                if token_validation.enabled:
                    user = get_user_by_id(token_validation.creator_uid, session=session)
                    return AuthUser(user)
                else:
                    flask.abort(
                        UNAUTHORIZED_STATUS_CODE, description="Token is disabled."
                    )
            else:
                flask.abort(UNAUTHORIZED_STATUS_CODE, description="Token is invalid.")
    return None


def abort_unauthorized():
    """
    Indicate that authorization is required
    :return:
    """
    abort(UNAUTHORIZED_STATUS_CODE)


def abort_forbidden():
    abort(ACCESS_RESTRICTED_STATUS_CODE)
