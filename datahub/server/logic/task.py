from app.db import with_session

from models.schedule import TaskSchedule


@with_session
def get_all_task(include_disabled=True, session=None):
    query = session.query(TaskSchedule)

    if not include_disabled:
        query = query.filter_by(enabled=True)

    return query.all()
