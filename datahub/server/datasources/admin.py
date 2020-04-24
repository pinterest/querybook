from functools import wraps
from flask_login import current_user

from app.datasource import register, admin_only, api_assert
from app.db import DBSession
from const.admin import AdminOperation, AdminItemType
from const.db import description_length
from env import DataHubSettings
from lib.engine_status_checker import ALL_ENGINE_STATUS_CHECKERS
from lib.metastore.loaders import ALL_METASTORE_LOADERS
from lib.query_executor.all_executors import ALL_EXECUTORS
from lib.utils.json import dumps
from lib.logger import get_logger

from logic import admin as logic
from logic import user as user_logic
from logic import schedule as schedule_logic
from logic import environment as environment_logic

from models.admin import (
    Announcement,
    QueryMetastore,
    QueryEngine,
    AdminAuditLog,
)

# OPEN APIs
LOG = get_logger(__file__)


"""
    ---------------------------------------------------------------------------------------------------------
    Admin Audit Log
    Record every action in the Admin API
    ---------------------------------------------------------------------------------------------------------
"""


def with_admin_audit_log(item_type: AdminItemType, op: AdminOperation):
    def wrapper(fn):
        @wraps(fn)
        def handler(*args, **kwargs):
            result = fn(*args, **kwargs)
            try:
                item_id = result["id"] if op == AdminOperation.CREATE else kwargs["id"]
                log = (
                    None
                    if op == AdminOperation.DELETE
                    else dumps(list(kwargs.keys()))[:description_length]
                )
                AdminAuditLog.create(
                    {
                        "uid": current_user.id,
                        "item_id": item_id,
                        "op": op,
                        "item_type": item_type.value,
                        "log": log,
                    }
                )
            except Exception as e:
                LOG.error(e, exc_info=True)
            finally:
                return result

        handler.__raw__ = fn
        return handler

    return wrapper


@register(
    "/announcement/", methods=["GET"],
)
def get_announcements():
    announcements = Announcement.get_all()
    announcements_dict = [announcement.to_dict() for announcement in announcements]
    return announcements_dict


# ADMIN ONLY APIs
@register(
    "/admin/announcement/", methods=["GET"],
)
@admin_only
def get_announcements_admin():
    announcements = Announcement.get_all()
    announcements_dict = [
        announcement.to_dict_admin() for announcement in announcements
    ]
    return announcements_dict


@register("/admin/announcement/", methods=["POST"])
@admin_only
@with_admin_audit_log(AdminItemType.Announcement, AdminOperation.CREATE)
def create_announcement(message, url_regex="", can_dismiss=True):
    with DBSession() as session:
        announcement = Announcement.create(
            {
                "uid": current_user.id,
                "url_regex": url_regex,
                "can_dismiss": can_dismiss,
                "message": message,
            },
            session=session,
        )
        announcement_dict = announcement.to_dict_admin()

    return announcement_dict


@register("/admin/announcement/<int:id>/", methods=["PUT"])
@admin_only
@with_admin_audit_log(AdminItemType.Announcement, AdminOperation.UPDATE)
def update_announcement(id, **kwargs):
    with DBSession() as session:
        announcement = Announcement.update(
            id=id,
            fields={**kwargs, "uid": current_user.id,},
            field_names=["uid", "message", "url_regex", "can_dismiss"],
            session=session,
        )
        announcement_dict = announcement.to_dict_admin()
    return announcement_dict


@register("/admin/announcement/<int:id>/", methods=["DELETE"])
@admin_only
@with_admin_audit_log(AdminItemType.Announcement, AdminOperation.DELETE)
def delete_announcement(id):
    Announcement.delete(id)


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
        engines = QueryEngine.get_all(session=session)
        engines_dict = [engine.to_dict_admin() for engine in engines]
        return engines_dict


@register(
    "/admin/query_engine/", methods=["POST"],
)
@admin_only
@with_admin_audit_log(AdminItemType.QueryEngine, AdminOperation.CREATE)
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
        query_engine = QueryEngine.create(
            {
                "name": name,
                "description": description,
                "language": language,
                "executor": executor,
                "executor_params": executor_params,
                "environment_id": environment_id,
                "metastore_id": metastore_id,
                "status_checker": status_checker,
            },
            session=session,
        )
        query_engine_dict = query_engine.to_dict_admin()

    return query_engine_dict


@register(
    "/admin/query_engine/<int:id>/", methods=["PUT"],
)
@admin_only
@with_admin_audit_log(AdminItemType.QueryEngine, AdminOperation.UPDATE)
def update_query_engine(id, **fields_to_update):
    with DBSession() as session:
        query_engine = QueryEngine.update(
            id,
            fields_to_update,
            field_names=[
                "name",
                "description",
                "language",
                "executor",
                "executor_params",
                "metastore_id",
                "environment_id",
                "deleted_at",
                "status_checker",
            ],
            session=session,
        )
        query_engine_dict = query_engine.to_dict_admin()
        return query_engine_dict


@register(
    "/admin/query_engine/<int:id>/", methods=["DELETE"],
)
@admin_only
@with_admin_audit_log(AdminItemType.QueryEngine, AdminOperation.DELETE)
def delete_query_engine(id,):
    logic.delete_query_engine_by_id(id)


@register(
    "/admin/query_engine/<int:id>/recover/", methods=["POST"],
)
@admin_only
@with_admin_audit_log(AdminItemType.QueryEngine, AdminOperation.UPDATE)
def recover_query_engine(id,):
    logic.recover_query_engine_by_id(id)


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
@with_admin_audit_log(AdminItemType.QueryMetastore, AdminOperation.CREATE)
def create_metastore(
    name, metastore_params, loader, acl_control=None,
):
    with DBSession() as session:
        # TODO: validate executor params
        metastore = QueryMetastore.create(
            {
                "name": name,
                "metastore_params": metastore_params,
                "loader": loader,
                "acl_control": acl_control,
            },
            session=session,
        )
        metastore_dict = metastore.to_dict_admin()
        return metastore_dict


@register(
    "/admin/query_metastore/<int:id>/", methods=["PUT"],
)
@admin_only
@with_admin_audit_log(AdminItemType.QueryMetastore, AdminOperation.UPDATE)
def update_metastore(
    id, **fields,
):
    with DBSession() as session:
        metastore = QueryMetastore.update(
            id=id,
            fields=fields,
            field_names=["name", "loader", "metastore_params", "acl_control"],
            update_callback=lambda m: logic.sync_metastore_schedule_job(
                m.id, session=session
            ),
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
@with_admin_audit_log(AdminItemType.QueryMetastore, AdminOperation.UPDATE)
def recover_metastore(id,):
    logic.recover_query_metastore_by_id(id)


@register(
    "/admin/query_metastore/<int:id>/", methods=["DELETE"],
)
@admin_only
@with_admin_audit_log(AdminItemType.QueryMetastore, AdminOperation.DELETE)
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
@with_admin_audit_log(AdminItemType.Admin, AdminOperation.CREATE)
def create_user_role(uid, role):
    with DBSession() as session:
        user_role = user_logic.create_user_role(uid=uid, role=role, session=session)
        user_role_dict = user_role.to_dict()

        return user_role_dict


@register(
    "/admin/user_role/<int:id>/", methods=["DELETE"],
)
@admin_only
@with_admin_audit_log(AdminItemType.Admin, AdminOperation.DELETE)
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


@register(
    "/admin/schedule/<int:id>/record/", methods=["GET"],
)
@admin_only
def get_task_run_records_by_name(
    id, offset=0, limit=10, hide_successful_jobs=False, task_type=None
):
    api_assert(limit < 1000, "You are requesting too much data")

    with DBSession() as session:
        task = schedule_logic.get_task_schedule_by_id(id=id, session=session)
        api_assert(task, "Invalid task id")

        records, _ = schedule_logic.get_task_run_record_run_by_name(
            name=task.name,
            offset=offset,
            limit=limit,
            hide_successful_jobs=hide_successful_jobs,
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
@with_admin_audit_log(AdminItemType.Environment, AdminOperation.CREATE)
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
@with_admin_audit_log(AdminItemType.Environment, AdminOperation.UPDATE)
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
@with_admin_audit_log(AdminItemType.Environment, AdminOperation.DELETE)
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


@register("/admin/environment/<int:id>/user/<int:uid>/", methods=["POST", "PUT"])
@admin_only
@with_admin_audit_log(AdminItemType.Environment, AdminOperation.UPDATE)
def add_user_to_environment(id, uid):
    environment_logic.add_user_to_environment(uid, id)


@register("/admin/environment/<int:id>/user/<int:uid>/", methods=["DELETE"])
@admin_only
@with_admin_audit_log(AdminItemType.Environment, AdminOperation.UPDATE)
def remove_user_from_environment(id, uid):
    environment_logic.remove_user_to_environment(uid, id)


@register("/admin/task/", methods=["GET"])
@admin_only
def get_all_tasks():
    tasks = schedule_logic.get_all_task_schedule()
    return [task.to_dict() for task in tasks]


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

        query_metastore = QueryMetastore.create(
            {
                "name": "default_metastore",
                "metastore_params": {
                    "connection_string": DataHubSettings.DATABASE_CONN,
                },
                "loader": "SqlAlchemyMetastoreLoader",
                "acl_control": {},
            },
            session=session,
        )
        metastore = query_metastore.to_dict_admin()

        query_engine = QueryEngine.create(
            {
                "name": "default_engine",
                "description": "",
                "language": "mysql",
                "executor": "sqlalchemy",
                "executor_params": {
                    "connection_string": DataHubSettings.DATABASE_CONN,
                },
                "environment_id": environment.id,
                "metastore_id": query_metastore.id,
            },
            session=session,
        )
        engine = query_engine.to_dict_admin()

        return [environment.to_dict(), metastore, engine]


admin_item_type_values = set(item.value for item in AdminItemType)


@register("/admin/audit_log/", methods=["GET"])
@admin_only
def get_admin_audit_logs(
    item_type=None, item_id=None, offset=0, limit=10,
):
    api_assert(limit < 200)
    api_assert(item_type is None or item_type in admin_item_type_values)

    filters = {}
    if item_type is not None:
        filters["item_type"] = item_type
    if item_id is not None:
        filters["item_id"] = item_id

    logs = AdminAuditLog.get_all(
        **filters, limit=limit, offset=offset, order_by="id", desc=True
    )
    return [log.to_dict() for log in logs]


@register("/admin/datahub_config/", methods=["GET"])
@admin_only
def get_admin_config():
    return {
        key: getattr(DataHubSettings, key)
        for key in dir(DataHubSettings)
        if not key.startswith("__")
    }
