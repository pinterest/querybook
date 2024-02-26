from datetime import datetime
import hashlib
import uuid
from sqlalchemy import func
from sqlalchemy import or_
from datetime import date

from app.db import with_session

from models.admin import (
    QueryEngine,
    QueryEngineEnvironment,
    QueryMetastore,
    APIAccessToken,
    Announcement,
)
from logic.schedule import (
    create_task_schedule,
    delete_task_schedule,
    get_task_schedule_by_name,
)


"""
    ---------------------------------------------------------------------------------------------------------
    QUERY ENGINE
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_query_engine_by_id(id, session=None):
    return session.query(QueryEngine).get(id)


@with_session
def get_query_engines_by_ids(ids, session=None):
    return session.query(QueryEngine).filter(QueryEngine.id.in_(ids)).all()


@with_session
def get_all_query_engines(session=None):
    return session.query(QueryEngine).all()


@with_session
def get_query_engines_by_environment(environment_id, ordered=False, session=None):
    query = (
        session.query(QueryEngine)
        .join(QueryEngineEnvironment)
        .filter(QueryEngineEnvironment.environment_id == environment_id)
        .filter(QueryEngine.deleted_at.is_(None))
    )

    if ordered:
        query = query.order_by(QueryEngineEnvironment.engine_order)

    return query.all()


@with_session
def add_query_engine_to_environment(
    environment_id, query_engine_id, commit=True, session=None
):
    max_engine_order = (
        next(
            iter(
                session.query(func.max(QueryEngineEnvironment.engine_order))
                .filter_by(environment_id=environment_id)
                .first()
            ),
            None,
        )
        or 0
    )
    return QueryEngineEnvironment.create(
        fields={
            "query_engine_id": query_engine_id,
            "environment_id": environment_id,
            "engine_order": max_engine_order + 1,
        },
        commit=commit,
        session=session,
    )


@with_session
def remove_query_engine_from_environment(environment_id, query_engine_id, session=None):
    session.query(QueryEngineEnvironment).filter_by(
        query_engine_id=query_engine_id,
        environment_id=environment_id,
    ).delete()
    session.commit()


@with_session
def swap_query_engine_order_in_environment(
    environment_id, from_index, to_index, commit=True, session=None
):
    if from_index == to_index:
        return  # NOOP

    qe_envs = (
        session.query(QueryEngineEnvironment)
        .filter_by(environment_id=environment_id)
        .order_by(QueryEngineEnvironment.engine_order)
        .all()
    )

    assert 0 <= from_index < len(qe_envs) and 0 <= to_index < len(
        qe_envs
    ), "Invalid index"
    item = qe_envs[from_index]

    from_item_order = item.engine_order
    to_item_order = qe_envs[to_index].engine_order

    is_move_down = from_item_order < to_item_order
    if is_move_down:
        session.query(QueryEngineEnvironment).filter(
            QueryEngineEnvironment.environment_id == environment_id
        ).filter(QueryEngineEnvironment.engine_order <= to_item_order).filter(
            QueryEngineEnvironment.engine_order > from_item_order
        ).update(
            {
                QueryEngineEnvironment.engine_order: QueryEngineEnvironment.engine_order
                - 1
            }
        )
    else:
        # moving up
        session.query(QueryEngineEnvironment).filter(
            QueryEngineEnvironment.environment_id == environment_id
        ).filter(QueryEngineEnvironment.engine_order >= to_item_order).filter(
            QueryEngineEnvironment.engine_order < from_item_order
        ).update(
            {
                QueryEngineEnvironment.engine_order: QueryEngineEnvironment.engine_order
                + 1
            }
        )
    # Move item to the right place
    item.engine_order = to_item_order

    if commit:
        session.commit()
    else:
        session.flush()


@with_session
def delete_query_engine_by_id(id, commit=True, session=None):
    query_engine = get_query_engine_by_id(id, session=session)
    if query_engine:
        query_engine.deleted_at = datetime.now()
        # session.delete(query_engine)
        if commit:
            session.commit()


@with_session
def recover_query_engine_by_id(id, commit=True, session=None):
    query_engine = get_query_engine_by_id(id, session=session)
    if query_engine:
        query_engine.deleted_at = None
        if commit:
            session.commit()


@with_session
def get_admin_announcements(session=None):
    return (
        session.query(Announcement)
        .filter(
            or_(
                Announcement.active_from.is_(None),
                Announcement.active_from <= date.today(),
            )
        )
        .filter(
            or_(
                Announcement.active_till.is_(None),
                Announcement.active_till >= date.today(),
            )
        )
        .all()
    )


"""
    ---------------------------------------------------------------------------------------------------------
    QUERY METASTORE ?
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def create_query_metastore_update_schedule(
    metastore_id, cron, commit=True, session=None
):
    task_schedule_name = get_metastore_schedule_job_name(metastore_id)
    metastore_update_schedule = create_task_schedule(
        name=task_schedule_name,
        task="tasks.update_metastore.update_metastore",
        cron=cron,
        args=[
            metastore_id,
        ],
        commit=commit,
        session=session,
    )
    session.commit()

    return metastore_update_schedule


@with_session
def get_query_metastore_by_id(id, session=None):
    return session.query(QueryMetastore).get(id)


@with_session
def get_query_metastore_by_name(name, session=None):
    return session.query(QueryMetastore).filter(QueryMetastore.name == name).first()


@with_session
def get_query_metastore_id_by_engine_id(engine_id: int, session=None):
    query_engine = get_query_engine_by_id(engine_id, session=session)
    return query_engine.metastore_id if query_engine else None


@with_session
def get_all_query_metastore(session=None):
    return session.query(QueryMetastore).all()


@with_session
def get_all_query_metastore_by_environment(environment_id, session=None):
    return (
        session.query(QueryMetastore)
        .join(QueryEngine)
        .join(QueryEngineEnvironment)
        .filter(QueryEngineEnvironment.environment_id == environment_id)
        .filter(QueryMetastore.deleted_at.is_(None))
        .all()
    )


@with_session
def recover_query_metastore_by_id(id, commit=True, session=None):
    query_metastore = get_query_metastore_by_id(id, session=session)
    if query_metastore:
        query_metastore.deleted_at = None

        if commit:
            sync_metastore_schedule_job(id, commit=False, session=session)
            session.commit()


@with_session
def delete_query_metastore_by_id(id, commit=True, session=None):
    query_metastore = get_query_metastore_by_id(id, session=session)
    if query_metastore:
        query_metastore.deleted_at = datetime.now()

        if commit:
            sync_metastore_schedule_job(id, commit=False, session=session)
            session.commit()


"""
    ---------------------------------------------------------------------------------------------------------
    API ACCESS TOKEN
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_api_access_token(token_string="", session=None):
    """
    Returns matching API Access Token
    """
    token_hash = hashlib.sha512(token_string.encode("utf-8")).hexdigest()
    return (
        session.query(APIAccessToken)
        .filter(APIAccessToken.token == token_hash)
        .filter(APIAccessToken.enabled.is_(True))
        .first()
    )  # noqa: E712


@with_session
def get_api_access_token_by_id(api_access_token_id, session=None):
    """
    Returns matching API Access Token
    """
    return session.query(APIAccessToken).get(api_access_token_id)


@with_session
def get_api_access_tokens(owner_uid=None, search_api_access_tokens="", session=None):
    """
    Returns all or matching API Access Tokens
    """
    query = session.query(APIAccessToken)
    query = query.filter(
        APIAccessToken.description.like("%" + search_api_access_tokens + "%")
    )
    return (
        query.order_by(APIAccessToken.enabled.desc())
        .order_by(APIAccessToken.updated_at.desc())
        .all()
    )


@with_session
def create_api_access_token(uid, description="", session=None):
    original_token = uuid.uuid4().hex
    token_hash = hashlib.sha512(original_token.encode("utf-8")).hexdigest()
    api_access_token = APIAccessToken(
        description=description, token=token_hash, creator_uid=uid, updater_uid=uid
    )
    session.add(api_access_token)
    session.commit()
    api_access_token.id
    return original_token


@with_session
def disable_api_access_tokens(uid, creator_uid, commit=True, session=None):
    """
    Disables all API Access Tokens created by given user
    """
    tokens = (
        session.query(APIAccessToken)
        .filter(APIAccessToken.creator_uid == creator_uid)
        .filter(APIAccessToken.enabled.is_(True))
        .all()
    )
    if tokens:
        for token in tokens:
            token.enabled = False
            token.updated_at = datetime.now()
            token.updater_uid = uid

        if commit:
            session.commit()


@with_session
def update_api_access_token(
    uid, api_access_token_id, enabled=False, commit=True, session=None
):
    api_access_token = get_api_access_token_by_id(api_access_token_id, session=session)
    if api_access_token:
        api_access_token.enabled = enabled
        api_access_token.updater_uid = uid
        api_access_token.updated_at = datetime.now()
        if commit:
            session.commit()
        else:
            session.flush()
        session.refresh(api_access_token)
        return api_access_token


"""
    ---------------------------------------------------------------------------------------------------------
    SCHEDULE
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def sync_metastore_schedule_job(metastore_id, commit=False, session=None):
    metastore = get_query_metastore_by_id(metastore_id, session=session)

    task_schedule_name = get_metastore_schedule_job_name(metastore_id)
    task_schedule = get_task_schedule_by_name(task_schedule_name, session=session)

    if metastore and metastore.deleted_at is None:
        if not task_schedule:
            create_task_schedule(
                name=task_schedule_name,
                task="tasks.update_metastore.update_metastore",
                cron="0 0 * * *",
                args=[
                    metastore_id,
                ],
                commit=commit,
                session=session,
            )
    elif task_schedule:
        delete_task_schedule(task_schedule.id, commit=commit, session=session)


def get_metastore_schedule_job_name(metastore_id: int) -> str:
    return f"update_metastore_{metastore_id}"
