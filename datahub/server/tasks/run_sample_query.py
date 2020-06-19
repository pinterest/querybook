from datetime import datetime

from app.flask_app import celery
from app.db import DBSession

from const.time import seconds_in_a_day
from lib.query_analysis.samples import make_samples_query
from lib.utils.utils import DATETIME_TO_UTC
from lib.utils.execute_query import ExecuteQuery
from lib.utils import mysql_cache


@celery.task(bind=True)
def run_sample_query(
    self, table_id, engine_id, uid, limit, partition, where, order_by, order_by_asc,
):
    with DBSession() as session:
        query = make_samples_query(
            table_id,
            limit=limit,
            partition=partition,
            where=where,
            order_by=order_by,
            order_by_asc=order_by_asc,
            session=session,
        )

        async_execute_query = ExecuteQuery(True)
        async_execute_query(query, engine_id, uid=uid, session=session)
        while not async_execute_query.poll():
            self.update_state(state="PROGRESS", meta=async_execute_query.progress)

        results = {
            "created_at": DATETIME_TO_UTC(datetime.now()),
            "value": async_execute_query.result,
            "engine_id": engine_id,
            "created_by": uid,
        }

        mysql_cache.set_key(
            f"table_samples_{table_id}_{uid}",
            results,
            expires_after=seconds_in_a_day,
            session=session,
        )
