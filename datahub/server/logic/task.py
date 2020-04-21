from app.db import with_session

from models.schedule import TaskSchedule


@with_session
def get_all_task(enabled=None, session=None):
    query = session.query(TaskSchedule)

    if enabled is not None:
        query = query.filter_by(enabled=enabled)

    return query.all()
