from flask_login import current_user

from app.auth.permission import (
    verify_environment_permission,
    verify_data_cell_permission,
    verify_data_doc_permission,
    verify_data_cells_permission,
)
from app.datasource import register, api_assert, with_impression
from app.flask_app import socketio, celery
from app.db import DBSession, with_session
from const.impression import ImpressionItemType
from const.query_execution import QueryExecutionType
from env import QuerybookSettings

from lib.celery.cron import validate_cron
from lib.logger import get_logger
from lib.notify.utils import get_user_preferred_notifier, notify_user
from lib.scheduled_datadoc.validator import validate_datadoc_schedule_config
from lib.scheduled_datadoc.legacy import convert_if_legacy_datadoc_schedule

from logic import (
    datadoc_collab,
    datadoc as logic,
    schedule as schedule_logic,
    user as user_logic,
)
from logic.datadoc_permission import assert_can_read, assert_can_write, assert_is_owner
from logic.query_execution import get_query_execution_by_id
from logic.schedule import (
    run_and_log_scheduled_task,
    update_datadoc_schedule_owner,
)
from models.environment import Environment

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
def create_data_doc(environment_id, cells=[], title=None, meta={}):
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
            meta=meta,
            session=session,
        )


@register("/datadoc/from_execution/", methods=["POST"])
def create_data_doc_from_execution(
    environment_id, execution_id, engine_id, query_string, title=None, meta={}
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
            meta=meta,
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


@register("/datadoc/<int:doc_id>/cell/<int:cell_id>/", methods=["DELETE"])
def delete_data_cell_from_doc(doc_id, cell_id):
    return datadoc_collab.delete_data_cell(doc_id, cell_id)


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
def update_data_cell(cell_id, fields={}, sid=""):
    return datadoc_collab.update_data_cell(cell_id, fields, sid=sid)


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
        data_cell_executions = []
        for (cell_id, executions) in cells_executions:
            latest_execution = None
            if executions:
                latest_execution = executions[0]
            data_cell_executions.append(
                (
                    cell_id,
                    [
                        execution.to_dict(with_statement=False)
                        for execution in executions
                    ],
                    latest_execution,
                )
            )
    return data_cell_executions


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
    "/favorite_data_doc/<int:data_doc_id>/",
    methods=["POST"],
    require_auth=True,
)
def create_favorite_data_doc(
    data_doc_id,
):
    return logic.favorite_data_doc(data_doc_id=data_doc_id, uid=current_user.id)


@register(
    "/favorite_data_doc/<int:data_doc_id>/",
    methods=["DELETE"],
    require_auth=True,
)
def delete_favorite_data_doc(
    data_doc_id,
):
    logic.unfavorite_data_doc(data_doc_id=data_doc_id, uid=current_user.id)


@register("/datadoc/<int:id>/schedule/", methods=["GET"])
def get_datadoc_schedule(id):
    with DBSession() as session:
        assert_can_read(id, session=session)
        verify_data_doc_permission(id, session=session)

        schedule_name = schedule_logic.get_data_doc_schedule_name(id)
        schedule = schedule_logic.get_task_schedule_by_name(
            schedule_name, session=session
        )
        if not schedule:
            return None

        schedule_dict = schedule.to_dict()
        schedule_dict["kwargs"] = convert_if_legacy_datadoc_schedule(
            schedule_dict["kwargs"]
        )
        return schedule_dict


@register("/datadoc/<int:id>/schedule/", methods=["POST"])
def create_datadoc_schedule(
    id,
    cron,
    kwargs,
):
    kwargs_valid, kwargs_valid_reason = validate_datadoc_schedule_config(kwargs)
    api_assert(kwargs_valid, kwargs_valid_reason)
    api_assert(validate_cron(cron), "Invalid cron expression")

    schedule_name = schedule_logic.get_data_doc_schedule_name(id)
    with DBSession() as session:
        assert_can_write(id, session=session)
        data_doc = logic.get_data_doc_by_id(id, session=session)
        verify_environment_permission([data_doc.environment_id])

        return schedule_logic.create_task_schedule(
            schedule_name,
            "tasks.run_datadoc.run_datadoc",
            cron=cron,
            kwargs={
                **kwargs,
                "user_id": data_doc.owner_uid,
                "doc_id": id,
            },
            task_type="user",
            session=session,
        )


@register("/datadoc/<int:id>/schedule/", methods=["PUT"])
def update_datadoc_schedule(id, cron=None, enabled=None, kwargs=None):
    if kwargs is not None:
        kwargs_valid, kwargs_valid_reason = validate_datadoc_schedule_config(kwargs)
        api_assert(kwargs_valid, kwargs_valid_reason)
    if cron is not None:
        api_assert(validate_cron(cron), "Invalid cron expression")

    schedule_name = schedule_logic.get_data_doc_schedule_name(id)
    with DBSession() as session:
        assert_can_write(id, session=session)

        schedule = schedule_logic.get_task_schedule_by_name(
            schedule_name, session=session
        )
        api_assert(schedule, "Schedule does not exist")
        verify_data_doc_permission(id, session=session)

        # schedule update will not change the owner
        # it will be always the datadoc owner
        data_doc = logic.get_data_doc_by_id(id, session=session)

        updated_fields = {}
        if cron is not None:
            updated_fields["cron"] = cron
        if enabled is not None:
            updated_fields["enabled"] = enabled
        if kwargs is not None:
            updated_fields["kwargs"] = {
                **kwargs,
                "user_id": data_doc.owner_uid,
                "doc_id": id,
            }

        return schedule_logic.update_task_schedule(
            schedule.id,
            session=session,
            **updated_fields,
        )


@register("/datadoc/<int:id>/schedule/", methods=["DELETE"])
def delete_datadoc_schedule(id):
    schedule_name = schedule_logic.get_data_doc_schedule_name(id)
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
            name=schedule_logic.get_data_doc_schedule_name(id), session=session
        )
        return runs


@register("/datadoc/<int:id>/schedule/run/", methods=["POST"])
def run_data_doc(id):
    schedule_name = schedule_logic.get_data_doc_schedule_name(id)
    with DBSession() as session:
        assert_can_write(id, session=session)
        verify_data_doc_permission(id, session=session)
        schedule = schedule_logic.get_task_schedule_by_name(
            schedule_name, session=session
        )
        api_assert(schedule, "Schedule does not exist")
        run_and_log_scheduled_task(schedule.id, session=session)


@register("/datadoc/<int:id>/run/", methods=["POST"])
def adhoc_run_data_doc(id, send_notification=False):
    assert_can_write(id)
    verify_data_doc_permission(id)

    notifier_name = get_user_preferred_notifier(current_user.id)

    notifications = (
        [
            {
                "config": {"to_user": [current_user.id]},
                "on": 0,
                "with": notifier_name,
            }
        ]
        if send_notification
        else []
    )

    celery.send_task(
        "tasks.run_datadoc.run_datadoc",
        args=[],
        kwargs={
            "doc_id": id,
            "user_id": current_user.id,
            "execution_type": QueryExecutionType.ADHOC.value,
            "notifications": notifications,
        },
    )


@register("/datadoc/<int:doc_id>/editor/", methods=["GET"])
def get_datadoc_editors(doc_id):
    return logic.get_data_doc_editors_by_doc_id(doc_id)


@register("/datadoc/scheduled/", methods=["GET"])
def get_my_datadoc_with_schedule(environment_id, offset=0, limit=10, filters=None):
    assert limit <= 100, "Too many docs"

    verify_environment_permission([environment_id])
    docs = []
    docs, count = schedule_logic.get_scheduled_data_docs_by_user(
        current_user.id,
        environment_id=environment_id,
        offset=offset,
        limit=limit,
        filters=filters,
    )

    return {"docs": docs, "count": count}


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
            data_doc_id=doc_id, uid=uid, read=read, write=write, commit=False
        )
        editor_dict = editor.to_dict()

        access_request = logic.get_data_doc_access_request_by_doc_id(
            doc_id=doc_id, uid=uid
        )
        if access_request:
            logic.remove_datadoc_access_request(doc_id=doc_id, uid=uid, commit=False)

        session.commit()

        # Update queries in elasticsearch to reflect new permissions
        logic.update_es_queries_by_datadoc_id(doc_id)

        if access_request:
            socketio.emit(
                "data_doc_access_request",
                (originator, doc_id, uid, None),
                namespace="/datadoc",
                room=doc_id,
                broadcast=True,
            )

        socketio.emit(
            "data_doc_editor",
            (originator, doc_id, uid, editor_dict),
            namespace="/datadoc",
            room=doc_id,
            broadcast=True,
        )
        logic.update_es_data_doc_by_id(doc_id)
        send_add_datadoc_editor_email(doc_id, uid, read, write)
        return editor_dict


@register("/datadoc/<int:doc_id>/access_request/", methods=["GET"])
def get_datadoc_access_requests(doc_id):
    assert_can_write(doc_id)
    return logic.get_data_doc_access_requests_by_doc_id(doc_id)


@register("/datadoc/<int:doc_id>/access_request/", methods=["POST"])
def add_datadoc_access_request(doc_id, originator=None):
    uid = current_user.id
    access_request_dict = None
    existing_access_requst = logic.get_data_doc_access_request_by_doc_id(
        doc_id=doc_id, uid=uid
    )
    if not existing_access_requst:
        access_request = logic.create_data_doc_access_request(doc_id=doc_id, uid=uid)
        access_request_dict = access_request.to_dict()
        socketio.emit(
            "data_doc_access_request",
            (originator, doc_id, uid, access_request_dict),
            namespace="/datadoc",
            room=doc_id,
            broadcast=True,
        )
    send_datadoc_access_request_notification(doc_id=doc_id, uid=uid)
    return access_request_dict


@register("/datadoc/<int:doc_id>/access_request/", methods=["DELETE"])
def remove_datadoc_access_request(doc_id, uid, originator=None):
    assert_can_write(doc_id)
    logic.remove_datadoc_access_request(doc_id=doc_id, uid=uid)
    socketio.emit(
        "data_doc_access_request",
        (originator, doc_id, uid, None),
        namespace="/datadoc",
        room=doc_id,
        broadcast=True,
    )


@with_session
def send_datadoc_access_request_notification(doc_id, uid, session=None):
    requestor = user_logic.get_user_by_id(uid, session=session)
    data_doc = logic.get_data_doc_by_id(doc_id, session=session)
    environment = data_doc.environment
    data_doc_title = data_doc.title or "Untitled"
    doc_url = f"{QuerybookSettings.PUBLIC_URL}/{environment.name}/datadoc/{doc_id}/"

    owner = user_logic.get_user_by_id(data_doc.owner_uid, session=session)
    doc_editors = [owner]
    writer_uids = [
        writer.uid for writer in logic.get_data_doc_writers_by_doc_id(doc_id)
    ]
    doc_editors.extend(user_logic.get_users_by_ids(writer_uids))
    requestor_username = requestor.get_name()
    for user in doc_editors:
        notify_user(
            user=user,
            template_name="datadoc_access_request",
            template_params=dict(
                username=requestor_username,
                data_doc_title=data_doc_title,
                doc_url=doc_url,
            ),
        )


@with_session
def send_add_datadoc_editor_email(doc_id, uid, read, write, session=None):
    inviting_user = user_logic.get_user_by_id(current_user.id, session=session)
    invited_user = user_logic.get_user_by_id(uid, session=session)
    data_doc = logic.get_data_doc_by_id(doc_id, session=session)
    environment = data_doc.environment

    read_or_write = "edit" if write else "view"
    data_doc_title = data_doc.title or "Untitled"

    doc_url = f"{QuerybookSettings.PUBLIC_URL}/{environment.name}/datadoc/{doc_id}/"

    notify_user(
        user=invited_user,
        template_name="datadoc_invitation",
        template_params=dict(
            inviting_username=inviting_user.get_name(),
            read_or_write=read_or_write,
            doc_url=doc_url,
            data_doc_title=data_doc_title,
        ),
        session=session,
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
    id,
    originator=None,  # Used for websocket to identify sender, optional
):
    with DBSession() as session:
        editor = logic.get_data_doc_editor_by_id(id, session=session)
        if editor:
            editor_dict = editor.to_dict()
            assert_can_write(editor.data_doc_id, session=session)
            logic.delete_data_doc_editor(
                id=id, doc_id=editor.data_doc_id, session=session
            )
            socketio.emit(
                "data_doc_editor",
                (originator, editor_dict["data_doc_id"], editor_dict["uid"], None),
                namespace="/datadoc",
                room=editor_dict["data_doc_id"],
                broadcast=True,
            )


@register("/datadoc/<int:doc_id>/owner/", methods=["POST"])
def update_datadoc_owner(doc_id, next_owner_id, originator=None):
    with DBSession() as session:
        # Add previous owner as an editor to the doc
        assert_is_owner(doc_id, session=session)
        current_owner_editor = logic.create_data_doc_editor(
            data_doc_id=doc_id,
            uid=current_user.id,
            read=True,
            write=True,
            commit=False,
            session=session,
        )
        current_owner_editor_dict = current_owner_editor.to_dict()
        # Remove next owner as a doc editor
        next_owner_editor = logic.get_data_doc_editor_by_id(
            next_owner_id, session=session
        )
        next_owner_editor_dict = next_owner_editor.to_dict()
        logic.delete_data_doc_editor(
            id=next_owner_id, doc_id=doc_id, session=session, commit=False
        )
        next_owner_uid = next_owner_editor_dict["uid"]
        # Update doc owner to next owner
        doc = logic.update_data_doc(
            id=doc_id, commit=False, session=session, owner_uid=next_owner_uid
        )
        # Update datadoc schedule's owner to next owner if there is any
        update_datadoc_schedule_owner(
            doc_id=doc_id, owner_id=next_owner_uid, commit=False, session=session
        )

        doc_dict = doc.to_dict()
        session.commit()
        socketio.emit(
            "data_doc_editor",
            (originator, doc_id, current_user.id, current_owner_editor_dict),
            namespace="/datadoc",
            room=doc_id,
            broadcast=True,
        )
        socketio.emit(
            "data_doc_editor",
            (
                originator,
                next_owner_editor_dict["data_doc_id"],
                next_owner_editor_dict["uid"],
                None,
            ),
            namespace="/datadoc",
            room=next_owner_editor_dict["data_doc_id"],
            broadcast=True,
        )
        socketio.emit(
            "data_doc_updated",
            (
                originator,
                doc_dict,
            ),
            namespace="/datadoc",
            room=next_owner_editor_dict["data_doc_id"],
            broadcast=True,
        )
        logic.update_es_data_doc_by_id(doc_id)
        # Update queries in elasticsearch to reflect new permissions
        logic.update_es_queries_by_datadoc_id(doc_id)

        send_datadoc_transfer_notification(doc_id, next_owner_uid, session)
        return current_owner_editor_dict


def send_datadoc_transfer_notification(doc_id, next_owner_id, session=None):
    inviting_user = user_logic.get_user_by_id(current_user.id, session=session)
    invited_user = user_logic.get_user_by_id(next_owner_id, session=session)
    data_doc = logic.get_data_doc_by_id(doc_id, session=session)
    environment = data_doc.environment

    data_doc_title = data_doc.title or "Untitled"

    doc_url = f"{QuerybookSettings.PUBLIC_URL}/{environment.name}/datadoc/{doc_id}/"

    notify_user(
        user=invited_user,
        template_name="datadoc_ownership_transfer",
        template_params=dict(
            inviting_username=inviting_user.get_name(),
            doc_url=doc_url,
            data_doc_title=data_doc_title,
        ),
        session=session,
    )
