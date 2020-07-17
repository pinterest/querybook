from flask_login import current_user

from app.auth.permission import (
    verify_environment_permission,
    verify_data_cell_permission,
    verify_data_doc_permission,
    verify_data_cells_permission,
)
from app.datasource import register, api_assert, with_impression
from app.flask_app import socketio
from app.db import DBSession, with_session
from const.impression import ImpressionItemType
from env import DataHubSettings

from lib.celery.cron import validate_cron
from lib.form import validate_form
from lib.export.all_exporters import get_exporter
from lib.logger import get_logger
from lib.config import get_config_value

from logic import (
    datadoc_collab,
    datadoc as logic,
    schedule as schedule_logic,
    user as user_logic,
)
from logic.datadoc_permission import assert_can_read, assert_can_write
from logic.query_execution import get_query_execution_by_id
from logic.schedule import run_and_log_scheduled_task
from models.environment import Environment
from lib.utils.utils import notify_user

LOG = get_logger(__file__)


@register("/datadoc/<int:id>/", methods=["GET"])
@with_impression("id", ImpressionItemType.DATA_DOC)
def get_datadoc(id):
    doc = datadoc_collab.get_datadoc(id)
    api_assert(doc, "Invalid doc")
    return doc


@register("/datadoc/<int:id>/", methods=["DELETE"])
def soft_delete_data_doc(id):
    with DBSession() as session:
        doc = logic.get_data_doc_by_id(id=id, session=session)
        api_assert(doc, "Invalid doc")
        verify_environment_permission([doc.environment_id])
        api_assert(
            current_user.id == doc.owner_uid, "You can only delete your own data doc"
        )
        logic.update_data_doc(id=id, archived=True, session=session)


@register("/datadoc/", methods=["GET"])
def get_data_docs(
    environment_id, filter_mode=None, offset=0, limit=500, archived=False
):
    with DBSession() as session:
        verify_environment_permission([environment_id])

        docs = []

        if filter_mode == "mine":
            docs = logic.get_data_doc_by_user(
                current_user.id,
                environment_id=environment_id,
                offset=offset,
                limit=limit,
                session=session,
            )
        elif filter_mode == "favorite":
            docs = logic.get_user_favorite_data_docs(
                current_user.id, environment_id=environment_id, session=session
            )
        elif filter_mode == "recent":
            docs = logic.get_user_recent_data_docs(
                current_user.id, environment_id=environment_id, session=session
            )
        return docs


@register("/datadoc/", methods=["POST"])
def create_data_doc(
    environment_id, cells=[], title=None,
):
    with DBSession() as session:
        verify_environment_permission([environment_id])
        environment = Environment.get(id=environment_id, session=session)

        return logic.create_data_doc(
            environment_id=environment_id,
            owner_uid=current_user.id,
            cells=cells,
            public=environment.shareable,
            archived=False,
            title=title,
            meta={},
            session=session,
        )


@register("/datadoc/from_execution/", methods=["POST"])
def create_data_doc_from_execution(
    environment_id, execution_id, engine_id, query_string, title=None,
):
    with DBSession() as session:
        verify_environment_permission([environment_id])
        environment = Environment.get(id=environment_id, session=session)
        execution = get_query_execution_by_id(execution_id, session=session)
        uid = current_user.id
        api_assert(
            execution.uid == uid, "You can only create from your own executions."
        )

        return logic.create_data_doc_from_execution(
            environment_id=environment_id,
            owner_uid=uid,
            engine_id=engine_id,
            query_string=query_string,
            execution_id=execution_id,
            public=environment.shareable,
            archived=False,
            title=title,
            meta={},
            session=session,
        )


@register("/datadoc/<int:id>/", methods=["PUT"])
def update_data_doc(id, **fields):
    return datadoc_collab.update_datadoc(id, fields)


@register("/datadoc/<int:doc_id>/cell/<int:index>/", methods=["POST"])
def insert_data_cell(doc_id, index, cell_type, context=None, meta=None):
    return datadoc_collab.insert_data_cell(doc_id, index, cell_type, context, meta)


@register(
    "/datadoc/<int:doc_id>/cell/<int:from_index>/<int:to_index>/", methods=["PUT"]
)
def move_data_cell(doc_id, from_index, to_index):
    return datadoc_collab.move_data_cell(doc_id, from_index, to_index)


@register("/data_cell/<int:cell_id>/copy/", methods=["POST"])
def paste_data_cell(cell_id, cut, doc_id, index):
    return datadoc_collab.paste_data_cell(cell_id, cut, doc_id, index)


@register("/datadoc/<int:doc_id>/cell/<int:index>/", methods=["DELETE"])
def delete_data_cell_from_doc(doc_id, index):
    return datadoc_collab.delete_data_cell(doc_id, index)


@register("/datadoc/<int:id>/clone/", methods=["POST"])
def clone_data_doc(id):
    with DBSession() as session:
        assert_can_read(id, session=session)
        try:
            verify_data_doc_permission(id, session=session)
            data_doc = logic.clone_data_doc(
                id=id, owner_uid=current_user.id, session=session
            )
            doc_dict = data_doc.to_dict(with_cells=True)
        except AssertionError as e:
            LOG.debug("Assert error")
            LOG.debug(e)
            api_assert(False, str(e))

        return doc_dict


@register("/data_cell/<int:cell_id>/", methods=["PUT"])
def update_data_cell(cell_id, **fields):
    return datadoc_collab.update_data_cell(cell_id, fields,)


@register("/data_cell/<int:id>/query_execution/", methods=["GET"])
def get_data_cell_executions(id):
    with DBSession() as session:
        verify_data_cell_permission(id, session=session)
        executions = logic.get_data_cell_executions(id, session=session)
        executions_dict = [
            execution.to_dict(with_statement=False) for execution in executions
        ]

        return executions_dict


@register("/batch/data_cell/query_execution/", methods=["POST"])
def batch_get_data_cell_executions(cell_ids):
    with DBSession() as session:
        verify_data_cells_permission(cell_ids, session=session)
        cells_executions = logic.get_data_cells_executions(cell_ids, session=session)
        return [
            (
                cell_id,
                [execution.to_dict(with_statement=False) for execution in executions],
            )
            for cell_id, executions in cells_executions
        ]


@register("/data_cell/<int:id>/datadoc_id/", methods=["GET"])
def get_data_doc_id_by_data_cell_id(id):
    with DBSession() as session:
        verify_data_cell_permission(id, session=session)
        data_doc = logic.get_data_doc_by_data_cell_id(id, session=session)
        assert_can_read(data_doc.id, session=session)
        return data_doc.id


@register("/function_documentation_language/<language>/", methods=["GET"])
def get_function_documentation_by_language(language):
    return logic.get_function_documentation_by_language(language=language)


@register(
    "/favorite_data_doc/<int:uid>/<int:data_doc_id>/",
    methods=["POST"],
    require_auth=True,
)
def create_favorite_data_doc(
    uid, data_doc_id,
):
    api_assert(current_user.id == uid, "You cannot favorite data doc for someone else")

    return logic.favorite_data_doc(data_doc_id=data_doc_id, uid=uid)


@register(
    "/favorite_data_doc/<int:uid>/<int:data_doc_id>/",
    methods=["DELETE"],
    require_auth=True,
)
def delete_favorite_data_doc(
    uid, data_doc_id,
):
    api_assert(
        current_user.id == uid, "You cannot unfavorite data doc for someone else"
    )

    logic.unfavorite_data_doc(data_doc_id=data_doc_id, uid=uid)


def get_data_doc_schedule_name(id: int):
    return f"run_data_doc_{id}"


@register("/datadoc/<int:id>/schedule/", methods=["GET"])
def get_datadoc_schedule(id):
    with DBSession() as session:
        assert_can_read(id, session=session)
        verify_data_doc_permission(id, session=session)

        schedule_name = get_data_doc_schedule_name(id)
        return schedule_logic.get_task_schedule_by_name(schedule_name, session=session)


def validate_datadoc_schedule_kwargs(kwargs):
    allowed_keys = [
        "notify_with",
        "notify_on",
        "exporter_cell_id",
        "exporter_name",
        "exporter_params",
    ]
    for key in kwargs.keys():
        api_assert(key in allowed_keys, "Invalid field {}".format(key))

    # Check if export_cell_id is provided then export name must be valid
    if kwargs.get("exporter_cell_id", None) is not None:
        exporter_name = kwargs.get("exporter_name", None)
        exporter = get_exporter(exporter_name)
        api_assert(exporter is not None, "Invalid exporter {}".format(exporter_name))

        exporter_params = kwargs.get("exporter_params", {})
        exporter_form = exporter.export_form
        if not (exporter_form is None and not exporter_params):
            valid, reason = validate_form(exporter_form, exporter_params)
            api_assert(valid, "Invalid exporter params, reason: " + reason)


@register("/datadoc/<int:id>/schedule/", methods=["POST"])
def create_datadoc_schedule(
    id, cron, kwargs,
):
    validate_datadoc_schedule_kwargs(kwargs)
    api_assert(validate_cron(cron), "Invalid cron expression")

    schedule_name = get_data_doc_schedule_name(id)
    with DBSession() as session:
        assert_can_write(id, session=session)
        data_doc = logic.get_data_doc_by_id(id, session=session)
        verify_environment_permission([data_doc.environment_id])

        return schedule_logic.create_task_schedule(
            schedule_name,
            "tasks.run_datadoc.run_datadoc",
            cron=cron,
            kwargs={**kwargs, "user_id": current_user.id, "doc_id": id},
            task_type="user",
            session=session,
        )


@register("/datadoc/<int:id>/schedule/", methods=["PUT"])
def update_datadoc_schedule(id, cron=None, enabled=None, kwargs=None):
    if kwargs is not None:
        validate_datadoc_schedule_kwargs(kwargs)
    if cron is not None:
        api_assert(validate_cron(cron), "Invalid cron expression")

    schedule_name = get_data_doc_schedule_name(id)
    with DBSession() as session:
        assert_can_write(id, session=session)

        schedule = schedule_logic.get_task_schedule_by_name(
            schedule_name, session=session
        )
        api_assert(schedule, "Schedule does not exist")
        verify_data_doc_permission(id, session=session)

        updated_fields = {}
        if cron is not None:
            updated_fields["cron"] = cron
        if enabled is not None:
            updated_fields["enabled"] = enabled
        if kwargs is not None:
            updated_fields["kwargs"] = {
                **kwargs,
                "user_id": current_user.id,
                "doc_id": id,
            }

        return schedule_logic.update_task_schedule(
            schedule.id, session=session, **updated_fields,
        )


@register("/datadoc/<int:id>/schedule/", methods=["DELETE"])
def delete_datadoc_schedule(id):
    schedule_name = get_data_doc_schedule_name(id)
    with DBSession() as session:
        assert_can_write(id, session=session)
        verify_data_doc_permission(id, session=session)

        schedule = schedule_logic.get_task_schedule_by_name(
            schedule_name, session=session
        )
        if schedule:
            schedule_logic.delete_task_schedule(schedule.id, session=session)


@register("/datadoc/<int:id>/schedule/logs/", methods=["GET"])
def get_datadoc_schedule_run(id):
    with DBSession() as session:
        assert_can_read(id, session=session)
        verify_data_doc_permission(id, session=session)

        runs, _ = schedule_logic.get_task_run_record_run_by_name(
            name=get_data_doc_schedule_name(id), session=session
        )
        return runs


@register("/datadoc/<int:id>/schedule/run/", methods=["POST"])
def run_data_doc(id):
    schedule_name = get_data_doc_schedule_name(id)
    with DBSession() as session:
        assert_can_write(id, session=session)
        verify_data_doc_permission(id, session=session)
        schedule = schedule_logic.get_task_schedule_by_name(
            schedule_name, session=session
        )
        api_assert(schedule, "Schedule does not exist")
        run_and_log_scheduled_task(schedule.id, session=session)


@register("/datadoc/<int:doc_id>/editor/", methods=["GET"])
def get_datadoc_editors(doc_id):
    return logic.get_data_doc_editors_by_doc_id(doc_id)


@register("/datadoc/<int:doc_id>/editor/<int:uid>/", methods=["POST"])
def add_datadoc_editor(
    doc_id,
    uid,
    read=None,
    write=None,
    originator=None,  # Used for websocket to identify sender, optional
):

    with DBSession() as session:
        assert_can_write(doc_id, session=session)
        editor = logic.create_data_doc_editor(
            data_doc_id=doc_id, uid=uid, read=read, write=write, session=session
        )

        editor_dict = editor.to_dict()

        # Notify all in the doc
        socketio.emit(
            "data_doc_editor",
            (originator, doc_id, uid, editor_dict),
            namespace="/datadoc",
            room=doc_id,
            broadcast=True,
        )

        # Email the person who got invited
        send_add_datadoc_editor_email(doc_id, uid, read, write, session=session)

        return editor_dict


@with_session
def send_add_datadoc_editor_email(doc_id, uid, read, write, session=None):
    inviting_user = user_logic.get_user_by_id(current_user.id, session=session)
    invited_user = user_logic.get_user_by_id(uid, session=session)
    data_doc = logic.get_data_doc_by_id(doc_id, session=session)
    environment = data_doc.environment

    inviting_username = inviting_user.get_name().capitalize()
    read_or_write = "edit" if write else "view"
    data_doc_title = data_doc.title or "Untitled"

    doc_url = f"{DataHubSettings.PUBLIC_URL}/{environment.name}/datadoc/{doc_id}/"
    invite_user_setting = user_logic.get_user_settings(
        uid, "notification_preference", session=session
    )

    notification_setting = (
        invite_user_setting.value
        if invite_user_setting is not None
        else get_config_value("user_setting.notification_preference.default")
    )
    notify_user(
        user=invited_user,
        notifier_name=notification_setting,
        template_name="datadoc_invitation",
        template_params=dict(
            username=invited_user.get_name().capitalize(),
            inviting_username=inviting_username,
            read_or_write=read_or_write,
            doc_url=doc_url,
            data_doc_title=data_doc_title,
        ),
    )


@register("/datadoc_editor/<int:id>/", methods=["PUT"])
def update_datadoc_editor(
    id,
    write=None,
    read=None,
    originator=None,  # Used for websocket to identify sender, optional
):
    with DBSession() as session:
        editor = logic.get_data_doc_editor_by_id(id, session=session)
        if editor:
            assert_can_write(editor.data_doc_id, session=session)

        editor = logic.update_data_doc_editor(id, read, write, session=session)

        if editor:
            editor_dict = editor.to_dict()
            socketio.emit(
                "data_doc_editor",
                (
                    originator,
                    editor_dict["data_doc_id"],
                    editor_dict["uid"],
                    editor_dict,
                ),
                namespace="/datadoc",
                room=editor_dict["data_doc_id"],
                broadcast=True,
            )
            return editor_dict


@register("/datadoc_editor/<int:id>/", methods=["DELETE"])
def delete_datadoc_editor(
    id, originator=None,  # Used for websocket to identify sender, optional
):
    with DBSession() as session:
        editor = logic.get_data_doc_editor_by_id(id, session=session)
        if editor:
            editor_dict = editor.to_dict()
            assert_can_write(editor.data_doc_id, session=session)
            logic.delete_data_doc_editor(id=id, session=session)
            socketio.emit(
                "data_doc_editor",
                (originator, editor_dict["data_doc_id"], editor_dict["uid"], None),
                namespace="/datadoc",
                room=editor_dict["data_doc_id"],
                broadcast=True,
            )
