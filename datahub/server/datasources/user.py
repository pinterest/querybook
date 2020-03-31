from flask import abort
from flask_login import current_user
from app.db import DBSession
from const.datasources import RESOURCE_NOT_FOUND_STATUS_CODE
from app.auth import logout as auth_logout
from app.datasource import register, api_assert
from logic import user as logic
from logic import environment as environment_logic
from logic import admin as admin_logic


@register("/user-me/", methods=["GET"])
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

    return user.to_dict()


@register("/batch/user/", methods=["POST"])
def batch_get_user_info(uids):
    return [user.to_dict() for user in logic.get_users_by_ids(uids)]


@register("/user/<int:uid>/setting/", methods=["GET"])
def get_user_settings(uid):
    settings = logic.get_user_settings(uid=uid)
    settings_dict = [setting.to_dict() for setting in settings]

    return settings_dict


@register("/user/<int:uid>/environment/", methods=["GET"])
def get_user_environment_ids(uid):
    api_assert(uid == current_user.id, "Cannot see environment for another user")

    visible_environments = environment_logic.get_all_visible_environments_by_uid(
        uid=uid
    )
    visible_environments_dict = [
        environment.to_dict() for environment in visible_environments
    ]

    user_environments = environment_logic.get_all_accessible_environment_ids_by_uid(
        uid=uid
    )
    user_environment_ids = [
        environment_id_tuple[0] for environment_id_tuple in user_environments
    ]
    return [visible_environments_dict, user_environment_ids]


@register("/user/<int:uid>/setting/<key>/", methods=["POST"], require_auth=True)
def set_user_setting(uid, key, value=None):
    api_assert(uid == current_user.id, "Cannot apply setting for another user")
    setting = logic.create_or_update_user_setting(uid=uid, key=key, value=value)
    return setting.to_dict()


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
