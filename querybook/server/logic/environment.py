from datetime import datetime
from sqlalchemy import or_
from app.db import with_session

# from lib.config import get_config_value
from logic.user import get_user_by_id
from models.environment import Environment, UserEnvironment
from models.user import User


@with_session
def create_environment(
    name,
    description=None,
    image=None,
    public=None,
    hidden=None,
    deleted_at=None,
    shareable=None,
    commit=True,
    session=None,
):
    return Environment.create(
        {
            "name": name,
            "description": description,
            "image": image,
            "public": public,
            "hidden": hidden,
            "deleted_at": deleted_at,
            "shareable": shareable,
        },
        commit=commit,
        session=session,
    )


@with_session
def get_environment_by_id(id, session=None):
    return session.query(Environment).get(id)


@with_session
def get_environment_by_name(name, session=None):
    return session.query(Environment).filter_by(name=name).first()


@with_session
def get_all_visible_environments_by_uid(uid, session=None):
    return (
        session.query(Environment)
        .outerjoin(UserEnvironment)
        .filter(Environment.deleted_at.is_(None))
        .filter(
            or_(
                Environment.hidden != True,  # noqa: E712
                UserEnvironment.user_id == uid,
                Environment.public == True,
            )
        )
        .all()
    )


@with_session
def get_all_accessible_environment_ids_by_uid(uid, session=None):
    return list(
        map(
            lambda r: r[0],
            (
                session.query(Environment.id)
                .outerjoin(UserEnvironment)
                .filter(Environment.deleted_at.is_(None))
                .filter(
                    or_(
                        Environment.public == True,  # noqa: E712
                        UserEnvironment.user_id == uid,
                    )
                )
                .all()
            ),
        )
    )


@with_session
def get_all_environment(include_deleted=False, session=None):
    query = session.query(Environment)

    if not include_deleted:
        query = query.filter_by(deleted_at=None)

    return query.all()


@with_session
def update_environment(id, commit=True, session=None, **field_to_update):
    return Environment.update(
        id,
        fields=field_to_update,
        field_names=["name", "description", "image", "public", "hidden", "shareable"],
        commit=commit,
        session=session,
    )


@with_session
def delete_environment_by_id(id, commit=True, session=None):
    environment = get_environment_by_id(id, session=session)
    if environment:
        environment.deleted_at = datetime.now()

        if commit:
            session.commit()
        else:
            session.flush()
        session.refresh(environment)


@with_session
def recover_environment_by_id(id, commit=True, session=None):
    environment = get_environment_by_id(id, session=session)
    if environment:
        environment.deleted_at = None

        if commit:
            session.commit()
        else:
            session.flush()
        session.refresh(environment)


@with_session
def get_users_in_environment(environment_id, offset=0, limit=100, session=None):
    return (
        session.query(User)
        .join(UserEnvironment)
        .filter(UserEnvironment.environment_id == environment_id)
        .offset(offset)
        .limit(limit)
        .all()
    )


@with_session
def add_user_to_environment(uid, environment_id, commit=True, session=None):
    user = get_user_by_id(uid, session=session)
    env = get_environment_by_id(environment_id, session=session)

    if user and env:
        env.users.append(user)

        if commit:
            session.commit()
        else:
            session.flush()


@with_session
def remove_user_to_environment(uid, environment_id, commit=True, session=None):
    user = get_user_by_id(uid, session=session)
    env = get_environment_by_id(environment_id, session=session)

    if user and env:
        session.query(UserEnvironment).filter_by(
            environment_id=environment_id, user_id=uid
        ).delete()

        if commit:
            session.commit()
        else:
            session.flush()


@with_session
def remove_user_from_all_environments(uid, commit=True, session=None):
    session.query(UserEnvironment).filter_by(user_id=uid).delete()

    if commit:
        session.commit()
    else:
        session.flush()
