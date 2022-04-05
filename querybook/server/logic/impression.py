from datetime import datetime, timedelta
from sqlalchemy.sql import func

from app.db import with_session
from const.impression import IMPRESSION_RETENTION_DELTA
from models.impression import Impression


"""
    ----------------------------------------------------------------------------------------------------------
    IMPRESSIONS
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def create_impression(item_id, item_type, uid, commit=True, session=None):
    impression = Impression(item_id=item_id, item_type=item_type, uid=uid)

    session.add(impression)

    if commit:
        session.commit()
        impression.id

    return impression


@with_session
def get_impressions_by_date(date, session=None):
    impressions = (
        session.query(Impression).filter(func.date(Impression.created_at) == date).all()
    )
    return impressions


@with_session
def get_impressions_by_date_range(start_date, end_date, session=None):
    impressions = (
        session.query(Impression)
        .filter(func.date(Impression.created_at) >= start_date)
        .filter(func.date(Impression.created_at) <= end_date)
        .all()
    )
    return impressions


@with_session
def get_impressions_by_item_type(item_type, session=None):
    impressions = (
        session.query(Impression).filter(Impression.item_type == item_type).all()
    )
    return impressions


@with_session
def get_impressions_by_item(item_type, item_id, limit, session=None):
    impressions = (
        session.query(Impression)
        .filter(Impression.item_type == item_type)
        .filter(Impression.item_id == item_id)
        .order_by(Impression.created_at.desc())
        .limit(limit)
        .all()
    )
    return impressions


@with_session
def get_viewers_by_item(item_type, item_id, limit=100, session=None):
    latest_viewers = (
        session.query(Impression.uid, func.max(Impression.created_at), func.count())
        .filter(Impression.item_type == item_type)
        .filter(Impression.item_id == item_id)
        .group_by(Impression.uid)
        .order_by(func.max(Impression.created_at).desc())
        .limit(limit)
        .all()
    )

    latest_viewers_objects = list(
        map(
            lambda x: {
                "uid": x[0],
                "latest_view_at": x[1],
                "views_count": x[2],
            },
            latest_viewers,
        )
    )

    return latest_viewers_objects


@with_session
def get_viewers_count_by_item_after_date(item_type, item_id, after_date, session=None):
    count = (
        session.query(Impression.uid)
        .distinct()
        .filter_by(item_type=item_type, item_id=item_id)
        .filter(Impression.created_at >= after_date)
        .count()
    )
    return count


@with_session
def get_item_timeseries_after_date(item_type, item_id, after_date, session=None):
    return (
        session.query(func.count(Impression.uid), func.date(Impression.created_at))
        .distinct(Impression.uid)
        .filter_by(item_type=item_type, item_id=item_id)
        .filter(Impression.created_at >= after_date)
        .group_by(func.date(Impression.created_at))
        .all()
    )


@with_session
def get_viewers_by_item_after_date(
    item_type, item_id, after_date, limit=10, session=None
):
    latest_viewers = (
        session.query(Impression.uid, func.max(Impression.created_at), func.count())
        .filter(Impression.item_type == item_type)
        .filter(Impression.item_id == item_id)
        .filter(Impression.created_at >= after_date)
        .group_by(Impression.uid)
        .order_by(func.max(Impression.created_at).desc())
        .limit(limit)
        .all()
    )

    latest_viewers_objects = list(
        map(
            lambda x: {
                "uid": x[0],
                "latest_view_at": x[1],
                "views_count": x[2],
            },
            latest_viewers,
        )
    )

    return latest_viewers_objects


def get_last_impressions_date():
    return (datetime.now() + timedelta(-IMPRESSION_RETENTION_DELTA)).date()
