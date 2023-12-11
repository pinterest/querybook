from sqlalchemy import func

from app.db import with_session
from const.elasticsearch import ElasticsearchItem
from const.user import UserGroup
from const.user_roles import UserRoleType
from lib.config import get_config_value
from lib.logger import get_logger
from models.user import User, UserRole, UserSetting, UserGroupMember
from tasks.sync_elasticsearch import sync_elasticsearch

LOG = get_logger(__file__)
user_settings_config = get_config_value("user_setting")

"""
    ----------------------------------------------------------------------------------------------------------
    USER
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_user_by_id(id, session=None):
    return User.get(id=id, session=session)


@with_session
def get_users_by_ids(ids, session=None):
    return session.query(User).filter(User.id.in_(ids)).all()


@with_session
def get_user_by_name(username, case_sensitive=True, session=None):
    if case_sensitive:
        return User.get(username=username, session=session)
    users = (
        session.query(User)
        .filter(func.lower(User.username) == username.lower())
        .order_by(User.id)
        .all()
    )
    if len(users) > 0:
        if len(users) > 1:
            LOG.warning(
                f"Multiple users were found for username '{username}' in case-insensitive search. Returning user with ID {users[0].id}."
            )
        return users[0]
    return None


@with_session
def create_user(
    username,
    password=None,
    fullname=None,
    profile_img=None,
    email=None,
    commit=True,
    session=None,
    properties={},
):

    user = User.create(
        fields={
            "username": username,
            "password": password,
            "fullname": fullname,
            "email": email,
            "profile_img": profile_img,
            "properties": properties,
        },
        commit=commit,
        session=session,
    )

    update_es_users_by_id(user.id)
    create_admin_when_no_admin(user, commit=commit, session=session)
    return user


@with_session
def update_user(uid, commit=True, session=None, **kwargs):
    return User.update(
        uid,
        fields=kwargs,
        field_names=[
            "fullname",
            "password",
            "profile_img",
            "deleted",
            "email",
            "properties",
        ],
        skip_if_value_none=True,
        session=session,
        commit=commit,
        update_callback=lambda u: update_es_users_by_id(u.id),
    )


@with_session
def update_user_properties(uid: int, commit=True, session=None, **properties):
    """Update the properties field of user. Key value pairs of properties
       will be updated to user, if properties value is None, then that property
       will be deleted.

    Arguments:
        uid {int} -- The user Id

    Keyword Arguments:
        commit {bool} -- Whether or not to commit the change (default: {True})
        session -- Sqlalchemy session, auto provided (default: {None})

    Returns:
        User -- The updated user object
    """

    user = get_user_by_id(uid, session=session)
    assert user is not None
    new_properties = {**user.properties}
    for key, value in properties.items():
        if value is None:
            new_properties.pop(key, None)
        else:
            new_properties[key] = value
    user.properties = new_properties

    if commit:
        session.commit()
    else:
        session.flush()
    session.refresh(user)

    return user


@with_session
def delete_user(uid, session=None):
    # user cannot be deleted
    pass


@with_session
def create_or_update_user_group(user_group: UserGroup, commit=True, session=None):
    group = get_user_by_name(user_group.name, session=session)
    fields = {
        "username": user_group.name,
        "fullname": user_group.display_name,
        "email": user_group.email,
        "is_group": True,
        "properties": {"public_info": {"description": user_group.description}},
    }

    if not group:
        # create a new group
        group = User.create(
            fields=fields,
            commit=commit,
            session=session,
        )
    else:
        # update the group
        group = User.update(
            id=group.id,
            fields=fields,
            commit=commit,
            session=session,
        )

    # get current existing member user ids
    existing_group_members = (
        session.query(UserGroupMember).filter(UserGroupMember.gid == group.id).all()
    )
    existing_group_member_ids = set([m.uid for m in existing_group_members])

    # get the latest member user ids by name
    group_members = (
        session.query(User).filter(User.username.in_(user_group.members)).all()
    )
    group_member_ids = set([m.id for m in group_members])

    members_to_delete = list(existing_group_member_ids - group_member_ids)
    members_to_add = list(group_member_ids - existing_group_member_ids)

    # delete group members not in the group anymore
    if members_to_delete:
        session.query(UserGroupMember).filter(UserGroupMember.gid == group.id).filter(
            UserGroupMember.uid.in_(members_to_delete)
        ).delete()

    # add new group members
    if members_to_add:
        session.add_all(
            [UserGroupMember(gid=group.id, uid=user_id) for user_id in members_to_add]
        )

    if commit:
        session.commit()
    else:
        session.flush()


"""
    ----------------------------------------------------------------------------------------------------------
    USER SETTINGS
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_user_settings(uid, key=None, session=None):
    query = session.query(UserSetting).filter(UserSetting.uid == uid)

    if key is not None:
        query = query.filter(UserSetting.key == key)
        return query.first()

    return query.all()


@with_session
def create_or_update_user_setting(uid, key, value, commit=True, session=None):
    is_per_env_key = "|" in key
    computed_key = key.split("|")[0] if is_per_env_key else key

    assert (
        computed_key in user_settings_config
    ), f"Invalid user setting key: {computed_key}"
    assert not is_per_env_key or bool(user_settings_config[computed_key].get("per_env"))

    if len(user_settings_config[computed_key]["options"]):
        assert (
            value in user_settings_config[computed_key]["options"]
        ), f"Invalid user setting value: {value}"

    user_key_setting = get_user_settings(uid, key, session=session)

    if user_key_setting and user_key_setting.value != value:
        # Update
        user_key_setting.value = value
    else:
        user_key_setting = UserSetting(uid=uid, key=key, value=value)
        session.add(user_key_setting)

    if commit:
        session.commit()
        user_key_setting.id

    return user_key_setting


"""
    ----------------------------------------------------------------------------------------------------------
    UserRole
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_all_user_role(session=None):
    return session.query(UserRole).all()


@with_session
def get_all_admin_user_roles(session=None):
    return session.query(UserRole).filter(UserRole.role == UserRoleType.ADMIN).all()


@with_session
def get_user_role_by_id(id, session=None):
    return session.query(UserRole).get(id)


@with_session
def create_user_role(uid, role, commit=True, session=None):
    user_role = UserRole(uid=uid, role=role)

    session.add(user_role)

    if commit:
        session.commit()
        session.refresh(user_role)

    return user_role


@with_session
def delete_user_role(id, commit=True, session=None):
    user_role = get_user_role_by_id(id, session=session)

    if user_role:
        session.delete(user_role)
        if commit:
            session.commit()


@with_session
def create_admin_when_no_admin(user, commit, session=None):
    if not commit and getattr(user, "id") is None:
        # Flush the session if user has no id
        session.flush()

    if len(get_all_admin_user_roles(session=session)) > 0:
        return

    create_user_role(
        uid=user.id, role=UserRoleType.ADMIN, commit=commit, session=session
    )


"""
    ---------------------------------------------------------------------------------------------------------
    ELASTICSEARCH
    ---------------------------------------------------------------------------------------------------------
"""


def update_es_users_by_id(uid):
    sync_elasticsearch.apply_async(args=[ElasticsearchItem.users.value, uid])
