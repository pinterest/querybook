from flask import abort
from app.auth import get_login_config
from flask_login import current_user
from app.db import DBSession
from const.datasources import RESOURCE_NOT_FOUND_STATUS_CODE
from app.auth import logout as auth_logout
from app.datasource import register, api_assert
from logic import user as logic
from logic import environment as environment_logic
from logic import admin as admin_logic


@register("/user/login_method/", methods=["GET"], require_auth=False)
def get_login_method():
    return get_login_config()


@register("/user/me/", methods=["GET"])
def get_my_user_info():
    with DBSession() as session:
        uid = current_user.id
        return {
            "uid": uid,
            "info": logic.get_user_by_id(uid, session=session).to_dict(with_roles=True),
        }


@register("/user/<int:uid>/", methods=["GET"])
def get_user_info(uid):
    user = logic.get_user_by_id(uid)

    if user is None:
        abort(RESOURCE_NOT_FOUND_STATUS_CODE)

    return user


@register("/batch/user/", methods=["POST"])
def batch_get_user_info(uids):
    return logic.get_users_by_ids(uids)


@register("/user/<int:uid>/setting/", methods=["GET"])
def get_user_settings(uid):
    api_assert(current_user.id == uid, "Can only check your own settings")
    return logic.get_user_settings(uid=uid)


@register("/user/<int:uid>/environment/", methods=["GET"])
def get_user_environment_ids(uid):
    api_assert(uid == current_user.id, "Cannot see environment for another user")

    visible_environments = environment_logic.get_all_visible_environments_by_uid(
        uid=uid
    )
    user_environments = environment_logic.get_all_accessible_environment_ids_by_uid(
        uid=uid
    )
    user_environment_ids = [
        environment_id_tuple[0] for environment_id_tuple in user_environments
    ]
    return [visible_environments, user_environment_ids]


@register("/user/<int:uid>/setting/<key>/", methods=["POST"])
def set_user_setting(uid, key, value=None):
    api_assert(uid == current_user.id, "Cannot apply setting for another user")
    return logic.create_or_update_user_setting(uid=uid, key=key, value=value)


@register("/logout/", methods=["GET"])
def logout():
    """Log out"""
    auth_logout()


@register(
    "/api_access_token/", methods=["GET"],
)
def verify_api_access_token():
    """
        Test route for API Access Token
    """
    return "token is enabled"


@register(
    "/api_access_token/", methods=["POST"],
)
def handle_create_api_access_tokens():
    """
        Diables all old tokens and creates a new one
        Returns new token
    """
    uid = current_user.id
    admin_logic.disable_api_access_tokens(uid, uid)
    return admin_logic.create_api_access_token(uid)
