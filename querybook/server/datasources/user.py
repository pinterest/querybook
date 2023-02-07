from flask import abort
from flask_login import current_user

from app.auth import get_login_config
from app.auth import logout as auth_logout
from app.datasource import register
from app.db import DBSession
from const.datasources import RESOURCE_NOT_FOUND_STATUS_CODE

from lib.notify.all_notifiers import ALL_NOTIFIERS
from lib.utils.version import get_version

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


@register("/user/<int:gid>/group_members/", methods=["GET"])
def get_user_group_members(gid):
    group = logic.get_user_by_id(gid)

    if group is None:
        abort(RESOURCE_NOT_FOUND_STATUS_CODE)

    return group.group_members


@register("/user/name/<username>/", methods=["GET"])
def get_user_info_by_username(username):
    user = logic.get_user_by_name(username)

    if user is None:
        abort(RESOURCE_NOT_FOUND_STATUS_CODE)

    return user


@register("/batch/user/", methods=["POST"])
def batch_get_user_info(uids):
    return logic.get_users_by_ids(uids)


@register("/user/setting/", methods=["GET"])
def get_user_settings():
    return logic.get_user_settings(uid=current_user.id)


@register("/user/environment/", methods=["GET"])
def get_user_environment_ids():
    visible_environments = environment_logic.get_all_visible_environments_by_uid(
        uid=current_user.id
    )
    user_environment_ids = environment_logic.get_all_accessible_environment_ids_by_uid(
        uid=current_user.id
    )
    return [visible_environments, user_environment_ids]


@register("/user/setting/<key>/", methods=["POST"], api_logging=False)
def set_user_setting(key, value=None):
    return logic.create_or_update_user_setting(
        uid=current_user.id, key=key, value=value
    )


@register("/logout/", methods=["GET"])
def logout():
    """Log out"""
    auth_logout()


@register(
    "/api_access_token/",
    methods=["GET"],
)
def verify_api_access_token():
    """
    Test route for API Access Token
    """
    return "token is enabled"


@register(
    "/api_access_token/",
    methods=["POST"],
)
def handle_create_api_access_tokens():
    """
    Diables all old tokens and creates a new one
    Returns new token
    """
    uid = current_user.id
    admin_logic.disable_api_access_tokens(uid, uid)
    return admin_logic.create_api_access_token(uid)


@register("/user/notifiers/", methods=["GET"])
def get_all_query_result_notifier():
    return ALL_NOTIFIERS


@register("/version/", methods=["GET"])
def get_querybook_version():
    """This gets the current version of querybook from package.json (source of truth)"""
    return get_version()
