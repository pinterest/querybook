from flask_login import current_user

from app.datasource import register, admin_only, api_assert
from app.db import DBSession
from env import DataHubSettings
from lib.engine_status_checker import ALL_ENGINE_STATUS_CHECKERS
from lib.metastore.loaders import ALL_METASTORE_LOADERS
from lib.query_executor.all_executors import ALL_EXECUTORS

from logic import admin as logic
from logic import user as user_logic
from logic import schedule as schedule_logic
from logic import environment as environment_logic

# OPEN APIs


@register(
    "/announcement/", methods=["GET"],
)
def get_announcements():
    announcements = logic.get_all_announcements()
    announcements_dict = [announcement.to_dict() for announcement in announcements]

    return announcements_dict


# ADMIN ONLY APIs


@register(
    "/admin/announcement/", methods=["GET"],
)
@admin_only
def get_announcements_admin():
    announcements = logic.get_all_announcements()
    announcements_dict = [
        announcement.to_dict_admin() for announcement in announcements
    ]
    return announcements_dict


@register("/admin/announcement/", methods=["POST"])
@admin_only
def create_announcement(message, url_regex="", can_dismiss=True):
    with DBSession() as session:
        announcement = logic.create_announcement(
            uid=current_user.id,
            url_regex=url_regex,
            can_dismiss=can_dismiss,
            message=message,
            session=session,
        )
        announcement_dict = announcement.to_dict_admin()

    return announcement_dict


@register("/admin/announcement/<int:id>/", methods=["PUT"])
@admin_only
def update_announcement(id, message, url_regex, can_dismiss):
    with DBSession() as session:
        announcement = logic.update_announcement(
            id=id,
            uid=current_user.id,
            message=message,
            url_regex=url_regex,
            can_dismiss=can_dismiss,
            session=session,
        )
        announcement_dict = announcement.to_dict_admin()
    return announcement_dict


@register("/admin/announcement/<int:id>/", methods=["DELETE"])
@admin_only
def delete_announcement(id):
    logic.delete_announcement(id)


@register("/admin/query_engine_template/", methods=["GET"])
@admin_only
def get_all_query_engines_templates():
    return [
        dict(
            language=executor_cls.EXECUTOR_LANGUAGE(),
            name=executor_cls.EXECUTOR_NAME(),
            template=executor_cls.EXECUTOR_TEMPLATE().to_dict(),
        )
        for executor_cls in ALL_EXECUTORS
    ]


@register("/admin/query_engine_status_checker/", methods=["GET"])
@admin_only
def get_query_engine_status_checkers():
    return [checker.NAME() for checker in ALL_ENGINE_STATUS_CHECKERS]


@register(
    "/admin/query_engine/", methods=["GET"],
)
@admin_only
def get_all_query_engines_admin():
    with DBSession() as session:
        engines = logic.get_all_query_engines(session=session)
        engines_dict = [engine.to_dict_admin() for engine in engines]
        return engines_dict


@register(
    "/admin/query_engine/", methods=["POST"],
)
@admin_only
def create_query_engine(
    name,
    language,
    executor,
    executor_params,
    environment_id,
    description=None,
    status_checker=None,
    metastore_id=None,
):
    with DBSession() as session:
        query_engine = logic.create_query_engine(
            name=name,
            description=description,
            language=language,
            executor=executor,
            executor_params=executor_params,
            environment_id=environment_id,
            metastore_id=metastore_id,
            status_checker=status_checker,
            session=session,
        )
        query_engine_dict = query_engine.to_dict_admin()

    return query_engine_dict


@register(
    "/admin/query_engine/<int:id>/", methods=["PUT"],
)
@admin_only
def update_query_engine(id, **fields_to_update):
    with DBSession() as session:
        query_engine = logic.update_query_engine(
            id=id, session=session, **fields_to_update
        )
        query_engine_dict = query_engine.to_dict_admin()
        return query_engine_dict


@register(
    "/admin/query_engine/<int:id>/", methods=["DELETE"],
)
@admin_only
def delete_query_engine(id,):
    logic.delete_query_engine_by_id(id)


@register(
    "/admin/query_metastore_loader/", methods=["GET"],
)
@admin_only
def get_all_query_metastore_loaders_admin():
    return [
        loader_class.serialize_loader_class() for loader_class in ALL_METASTORE_LOADERS
    ]


@register(
    "/admin/query_metastore/", methods=["GET"],
)
@admin_only
def get_all_query_metastores_admin():

    with DBSession() as session:
        metastores = logic.get_all_query_metastore(session=session)
        metastores_dict = [metastore.to_dict_admin() for metastore in metastores]
        return metastores_dict

    return []


@register(
    "/admin/query_metastore/", methods=["POST"],
)
@admin_only
def create_metastore(
    name, metastore_params, loader, acl_control=None,
):
    with DBSession() as session:
        metastore = logic.create_query_metastore(
            name=name,
            metastore_params=metastore_params,
            loader=loader,
            acl_control=acl_control,
            session=session,
        )
        metastore_dict = metastore.to_dict_admin()
        return metastore_dict


@register(
    "/admin/query_metastore/<int:id>/", methods=["PUT"],
)
@admin_only
def update_metastore(
    id, name=None, loader=None, metastore_params=None, acl_control=None,
):
    with DBSession() as session:
        metastore = logic.update_query_metastore(
            id=id,
            name=name,
            metastore_params=metastore_params,
            loader=loader,
            acl_control=acl_control,
            session=session,
        )
        metastore_dict = metastore.to_dict_admin()
        return metastore_dict


@register(
    "/admin/query_metastore/<int:id>/schedule/", methods=["POST"],
)
@admin_only
def create_metastore_schedule(
    id, cron,
):
    with DBSession() as session:
        schedule = logic.create_query_metastore_update_schedule(
            metastore_id=id, cron=cron, session=session
        )
        if schedule:
            return schedule.to_dict()


@register(
    "/admin/query_metastore/<int:id>/recover/", methods=["PUT"],
)
@admin_only
def recover_metastore(id,):
    logic.recover_query_metastore_by_id(id)


@register(
    "/admin/query_metastore/<int:id>/", methods=["DELETE"],
)
@admin_only
def delete_metastore(id,):
    logic.delete_query_metastore_by_id(id)


@register(
    "/admin/user_role/", methods=["GET"],
)
@admin_only
def get_all_user_role_admin():
    with DBSession() as session:
        user_roles = user_logic.get_all_user_role(session=session)
        user_role_dicts = [user_role.to_dict() for user_role in user_roles]
        return user_role_dicts


@register(
    "/admin/user_role/", methods=["POST"],
)
@admin_only
def create_user_role(uid, role):
    with DBSession() as session:
        user_role = user_logic.create_user_role(uid=uid, role=role, session=session)
        user_role_dict = user_role.to_dict()

        return user_role_dict


@register(
    "/admin/user_role/<int:id>/", methods=["DELETE"],
)
@admin_only
def delete_user_role(id,):
    user_logic.delete_user_role(id)


@register(
    "/admin/schedule/record/", methods=["GET"],
)
@admin_only
def get_task_run_records(
    name, offset=0, limit=10, hide_successful_jobs=False, task_type=None
):
    api_assert(limit < 1000, "You are requesting too much data")

    with DBSession() as session:
        records = schedule_logic.get_task_run_records(
            name=name,
            offset=offset,
            limit=limit,
            hide_successful_jobs=hide_successful_jobs,
            task_type=task_type,
            session=session,
        )

        data = []
        for record in records:
            record_dict = record.to_dict()
            record_dict["task_type"] = record.task.task_type
            data.append(record_dict)

        return data


@register("/admin/environment/", methods=["GET"])
def get_all_environments_admin():
    environments = environment_logic.get_all_environment(include_deleted=True)
    return [environment.to_dict() for environment in environments]


@register("/admin/environment/", methods=["POST"])
@admin_only
def create_environment(
    name,
    description=None,
    image=None,
    public=None,
    hidden=None,
    deleted_at=None,
    shareable=None,
):
    environment = environment_logic.create_environment(
        name=name,
        description=description,
        image=image,
        public=public,
        hidden=hidden,
        deleted_at=deleted_at,
        shareable=shareable,
    )

    return environment.to_dict()


@register("/admin/environment/<int:id>/", methods=["PUT"])
@admin_only
def update_environment(id, **fields_to_update):
    environment = environment_logic.update_environment(id=id, **fields_to_update,)
    return environment.to_dict()


@register(
    "/admin/environment/<int:id>/recover/", methods=["PUT"],
)
@admin_only
def recover_environment(id,):
    environment_logic.recover_environment_by_id(id)


@register(
    "/admin/environment/<int:id>/", methods=["DELETE"],
)
@admin_only
def delete_environment(id,):
    environment_logic.delete_environment_by_id(id)


@register("/admin/environment/<int:id>/users/", methods=["GET"])
@admin_only
def get_users_in_environment(
    id, limit, offset,
):
    with DBSession() as session:
        users = environment_logic.get_users_in_environment(
            id, offset, limit, session=session
        )
        return [user.to_dict() for user in users]


@register("/admin/environment/<int:eid>/user/<int:uid>/", methods=["POST", "PUT"])
@admin_only
def add_user_to_environment(eid, uid):
    environment_logic.add_user_to_environment(uid, eid)


@register("/admin/environment/<int:eid>/user/<int:uid>/", methods=["DELETE"])
@admin_only
def remove_user_from_environment(eid, uid):
    environment_logic.remove_user_to_environment(uid, eid)


"""
    ---------------------------------------------------------------------------------------------------------
    API ACCESS TOKEN
    ---------------------------------------------------------------------------------------------------------
"""


@register(
    "/admin/api_access_token/<token_id>/", methods=["PUT"],
)
@admin_only
def update_api_access_token_admin(token_id, enabled=False):
    """
        Allow admins to enable/disable API Access Tokens
    """
    uid = current_user.id
    return logic.update_api_access_token(uid, token_id, enabled)


@register(
    "/admin/api_access_tokens/", methods=["GET"],
)
@admin_only
def get_api_access_tokens_admin():
    """
        Returns all API Access Tokens
    """
    my_tokens = logic.get_api_access_tokens()
    my_tokens_dict = [my_token.to_dict() for my_token in my_tokens]
    return my_tokens_dict


@register("/admin/one_click_set_up/", methods=["POST"])
@admin_only
def exec_one_click_set_up():

    with DBSession() as session:
        environment = environment_logic.create_environment(
            name="default_environment",
            description="",
            image="",
            public=True,
            session=session,
        )

        query_metastore = logic.create_query_metastore(
            name="default_metastore",
            metastore_params={"connection_string": DataHubSettings.DATABASE_CONN,},
            loader="SqlAlchemyMetastoreLoader",
            acl_control={},
            session=session,
        )
        metastore = query_metastore.to_dict_admin()

        query_engine = logic.create_query_engine(
            name="default_engine",
            description="",
            language="mysql",
            executor="sqlalchemy",
            executor_params={"connection_string": DataHubSettings.DATABASE_CONN,},
            environment_id=1,
            metastore_id=1,
            session=session,
        )
        engine = query_engine.to_dict_admin()

        return [environment.to_dict(), metastore, engine]
