from datetime import datetime
import hashlib
import uuid

from app.db import with_session
from lib.sqlalchemy import update_model_fields

from models.admin import (
    Announcement,
    QueryEngine,
    QueryMetastore,
    APIAccessToken,
)
from logic.schedule import (
    create_task_schedule,
    delete_task_schedule,
    get_task_schedule_by_name,
)

"""
    ---------------------------------------------------------------------------------------------------------
    ANNOUNCEMENT
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def create_announcement(
    message, url_regex, can_dismiss, uid, commit=True, session=None
):
    announcement = Announcement(
        message=message, url_regex=url_regex, can_dismiss=can_dismiss, uid=uid
    )
    session.add(announcement)

    if commit:
        session.commit()
        announcement.id
    return announcement


@with_session
def update_announcement(
    id, message, url_regex, can_dismiss, uid, commit=True, session=None
):
    announcement = get_announcement_by_id(id, session=session)
    if not announcement:
        return

    announcement.uid = uid

    if message is not None:
        announcement.message = message
    if url_regex is not None:
        announcement.url_regex = url_regex
    if can_dismiss is not None:
        announcement.can_dismiss = can_dismiss

    announcement.updated_at = datetime.utcnow()
    if commit:
        session.commit()
        announcement.id
    return announcement


@with_session
def delete_announcement(id, commit=True, session=None):
    announcement = get_announcement_by_id(id, session=session)
    if not announcement:
        return

    session.delete(announcement)
    if commit:
        session.commit()


@with_session
def get_announcement_by_id(id, session=None):
    return session.query(Announcement).get(id)


@with_session
def get_all_announcements(session=None):
    return session.query(Announcement).all()


"""
    ---------------------------------------------------------------------------------------------------------
    QUERY ENGINE
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def create_query_engine(
    name,
    description,
    language,
    executor,
    executor_params,
    environment_id,
    status_checker=None,
    metastore_id=None,
    commit=True,
    session=None,
):
    # TODO: validate executor params
    query_engine = QueryEngine(
        name=name,
        description=description,
        language=language,
        executor=executor,
        environment_id=environment_id,
        metastore_id=metastore_id,
        executor_params=executor_params,
        status_checker=status_checker,
    )

    session.add(query_engine)
    if commit:
        session.commit()
        query_engine.id

    return query_engine


@with_session
def update_query_engine(id, commit=True, session=None, **field_to_update):
    query_engine = get_query_engine_by_id(id, session=session)

    if not query_engine:
        return

    allowed_fields = [
        "name",
        "description",
        "language",
        "executor",
        "executor_params",
        "metastore_id",
        "environment_id",
        "deleted_at",
        "status_checker",
    ]
    for field in allowed_fields:
        if field in field_to_update:
            setattr(query_engine, field, field_to_update[field])

    if commit:
        session.commit()
        query_engine.id

    return query_engine


@with_session
def get_query_engine_by_id(id, session=None):
    return session.query(QueryEngine).get(id)


@with_session
def get_all_query_engines(session=None):
    return session.query(QueryEngine).all()


@with_session
def get_query_engines_by_environment(environment_id, session=None):
    return (
        session.query(QueryEngine)
        .filter_by(environment_id=environment_id, deleted_at=None,)
        .all()
    )


@with_session
def delete_query_engine_by_id(id, commit=True, session=None):
    query_engine = get_query_engine_by_id(id, session=session)
    if query_engine:
        query_engine.deleted_at = datetime.now()
        # session.delete(query_engine)
        if commit:
            session.commit()


"""
    ---------------------------------------------------------------------------------------------------------
    QUERY METASTORE ?
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def create_query_metastore(
    name, metastore_params, loader, acl_control=None, commit=True, session=None
):
    # TODO: validate executor params
    query_metastore = QueryMetastore(
        name=name,
        metastore_params=metastore_params,
        loader=loader,
        acl_control=acl_control,
    )

    session.add(query_metastore)
    if commit:
        session.flush()
        session.commit()

    return query_metastore


@with_session
def create_query_metastore_update_schedule(
    metastore_id, cron, commit=True, session=None
):
    task_schedule_name = get_metastore_schedule_job_name(metastore_id)
    metastore_update_schedule = create_task_schedule(
        name=task_schedule_name,
        task="tasks.update_metastore.update_metastore",
        cron=cron,
        args=[metastore_id,],
        commit=commit,
        session=session,
    )
    session.commit()

    return metastore_update_schedule


@with_session
def update_query_metastore(id, commit=True, session=None, **kwargs):
    query_metastore = get_query_metastore_by_id(id, session=session)

    if not query_metastore:
        return

    updated = update_model_fields(
        query_metastore,
        skip_if_value_none=True,
        field_names=["name", "metastore_params", "acl_control", "deleted_at", "loader"],
        **kwargs,
    )

    if updated:
        query_metastore.updated_at = datetime.utcnow()
        if commit:
            sync_metastore_schedule_job(
                query_metastore.id, commit=False, session=session
            )
            session.commit()

    return query_metastore


@with_session
def get_query_metastore_by_id(id, session=None):
    return session.query(QueryMetastore).get(id)


@with_session
def get_all_query_metastore(session=None):
    return session.query(QueryMetastore).all()


@with_session
def get_all_query_metastore_by_environment(environment_id, session=None):
    return (
        session.query(QueryMetastore)
        .join(QueryEngine)
        .filter(QueryEngine.environment_id == environment_id)
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
                args=[metastore_id,],
                commit=commit,
                session=session,
            )
    elif task_schedule:
        delete_task_schedule(task_schedule.id, commit=commit, session=session)


def get_metastore_schedule_job_name(metastore_id: int) -> str:
    return f"update_metastore_{metastore_id}"
