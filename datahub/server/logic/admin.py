from datetime import datetime
import hashlib
import uuid

from app.db import with_session

from models.admin import (
    QueryEngine,
    QueryMetastore,
    APIAccessToken,
)
from logic.schedule import (
    create_task_schedule,
    delete_task_schedule,
    get_task_schedule_by_name,
)
from logic import datadoc as data_doc_logic


"""
    ---------------------------------------------------------------------------------------------------------
    QUERY ENGINE
    ---------------------------------------------------------------------------------------------------------
"""


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


@with_session
def recover_query_engine_by_id(id, commit=True, session=None):
    query_engine = get_query_engine_by_id(id, session=session)
    if query_engine:
        query_engine.deleted_at = None
        if commit:
            session.commit()


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
        args=[metastore_id,],
        commit=commit,
        session=session,
    )
    session.commit()

    return metastore_update_schedule


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


"""
    ---------------------------------------------------------------------------------------------------------
    DEMO
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def create_demo_data_doc(environment_id, engine_id, uid, session=None):
    # create datadoc
    data_doc_id = data_doc_logic.create_data_doc(
        public=True,
        archived=False,
        environment_id=environment_id,
        owner_uid=uid,
        title="World Happiness Report (2015-2019)",
        meta={},
        session=session,
    ).id
    # create cells
    cell_ids = []

    c_query = """SELECT
    w9.Country,
    w9.Rank AS [2019],
    w8.Rank AS [2018],
    w7.HappinessRank AS [2017],
    w6.HappinessRank AS [2016],
    w5.HappinessRank AS [2015]
FROM
    world_happiness_2019 w9
    INNER JOIN world_happiness_2018 w8 ON w9.Country = w8.Country
    INNER JOIN world_happiness_2017 w7 ON w9.Country = w7.Country
    INNER JOIN world_happiness_2016 w6 ON w9.Country = w6.Country
    INNER JOIN world_happiness_2015 w5 ON w9.Country = w5.Country
    AND (w5.Region = 'Western Europe');
    """
    c_meta = {"title": "Western Europe Countries Ranking", "engine": engine_id}
    c_id = data_doc_logic.create_data_cell(
        cell_type="query", context=c_query, meta=c_meta, commit=False, session=session
    ).id
    cell_ids.append(c_id)

    c_meta = {
        "title": "Western Europe Countries Ranking",
        "data": {
            "source_type": "cell_above",
            "transformations": {"format": {}, "aggregate": False, "switch": True},
        },
        "chart": {
            "type": "line",
            "x_axis": {"col_idx": 0, "label": "Year", "sort": {"idx": 0, "asc": True}},
            "y_axis": {
                "label": "Rank",
                "stack": False,
                "series": {
                    "0": {"agg_type": "sum"},
                    "1": {"agg_type": "sum"},
                    "2": {"agg_type": "sum"},
                    "3": {"agg_type": "sum"},
                    "4": {"agg_type": "sum"},
                    "5": {"agg_type": "sum"},
                    "6": {"agg_type": "sum"},
                    "7": {"agg_type": "sum"},
                    "8": {"agg_type": "sum"},
                    "9": {"agg_type": "sum"},
                    "10": {"agg_type": "sum"},
                    "11": {"agg_type": "sum"},
                    "12": {"agg_type": "sum"},
                    "13": {"agg_type": "sum"},
                    "14": {"agg_type": "sum"},
                    "15": {"agg_type": "sum"},
                    "16": {"agg_type": "sum"},
                    "17": {"agg_type": "sum"},
                    "18": {"agg_type": "sum"},
                    "19": {"agg_type": "sum"},
                    "20": {"agg_type": "sum"},
                },
            },
        },
        "visual": {"legend_position": "top"},
        "collapsed": False,
    }
    c_id = data_doc_logic.create_data_cell(
        cell_type="chart", context="", meta=c_meta, commit=False, session=session
    ).id
    cell_ids.append(c_id)

    c_query = """SELECT
    Country,
    GDP,
    SocialSupport,
    HealthyLifeExpectancy,
    FreedomToMakeLifeChoices,
    Generosity,
    PerceptionsOfCorruption
FROM
    world_happiness_2019
LIMIT
    10;
    """
    c_meta = {"title": "2019 Top 10 Countries", "engine": engine_id}
    c_id = data_doc_logic.create_data_cell(
        cell_type="query", context=c_query, meta=c_meta, commit=False, session=session
    ).id
    cell_ids.append(c_id)

    c_meta = {
        "title": "2019 Top 10 Countries",
        "data": {
            "source_type": "cell_above",
            "transformations": {"format": {}, "aggregate": False, "switch": True},
        },
        "chart": {
            "type": "bar",
            "x_axis": {"col_idx": 0, "label": "Categories"},
            "y_axis": {
                "label": "Score",
                "stack": False,
                "series": {
                    "0": {"agg_type": "sum"},
                    "1": {"agg_type": "sum"},
                    "2": {"agg_type": "sum"},
                    "3": {"agg_type": "sum"},
                    "4": {"agg_type": "sum"},
                    "5": {"agg_type": "sum"},
                    "6": {"agg_type": "sum"},
                    "7": {"agg_type": "sum"},
                    "8": {"agg_type": "sum"},
                    "9": {"agg_type": "sum"},
                    "10": {"agg_type": "sum"},
                },
            },
        },
        "visual": {"legend_position": "top"},
        "collapsed": False,
    }
    c_id = data_doc_logic.create_data_cell(
        cell_type="chart", context="", meta=c_meta, commit=False, session=session
    ).id
    cell_ids.append(c_id)

    c_query = """SELECT
  *
FROM(
    SELECT
      '2019' AS Year,
      Country,
      Score
    FROM
      world_happiness_2019
    ORDER BY
      Rank
    LIMIT
      10
  )
UNION
SELECT
  *
FROM(
    SELECT
      '2018' AS Year,
      Country,
      Score
    FROM
      world_happiness_2018
    ORDER BY
      Rank
    LIMIT
      10
  )
UNION
SELECT
  *
FROM(
    SELECT
      '2017' AS Year,
      Country,
      HappinessScore AS Score
    FROM
      world_happiness_2017
    ORDER BY
      HappinessRank
    LIMIT
      10
  )
UNION
SELECT
  *
FROM(
    SELECT
      '2016' AS Year,
      Country,
      HappinessScore AS Score
    FROM
      world_happiness_2016
    ORDER BY
      HappinessRank
    LIMIT
      10
  )
UNION
SELECT
  *
FROM(
    SELECT
      '2015' AS Year,
      Country,
      HappinessScore AS Score
    FROM
      world_happiness_2015
    ORDER BY
      HappinessRank
    LIMIT
      10
  )
ORDER BY
  Score DESC;
    """
    c_meta = {"title": "Top 10 Countries Score", "engine": engine_id}
    c_id = data_doc_logic.create_data_cell(
        cell_type="query", context=c_query, meta=c_meta, commit=False, session=session
    ).id
    cell_ids.append(c_id)

    c_meta = {
        "title": "Top 10 Countries Score",
        "data": {
            "source_type": "cell_above",
            "transformations": {
                "format": {"agg_col": 1, "series_col": 0, "value_cols": [2]},
                "aggregate": True,
                "switch": False,
            },
        },
        "chart": {
            "type": "bar",
            "x_axis": {"col_idx": 0, "label": "Country"},
            "y_axis": {
                "label": "Happiness Score",
                "stack": False,
                "series": {
                    "0": {"agg_type": "sum"},
                    "1": {"color": 1, "agg_type": "sum"},
                    "2": {"color": 5, "agg_type": "sum"},
                    "3": {"agg_type": "sum"},
                    "4": {"color": 6, "agg_type": "sum"},
                    "5": {"color": 9, "agg_type": "sum"},
                },
            },
        },
        "visual": {"legend_position": "top"},
        "collapsed": False,
    }
    c_id = data_doc_logic.create_data_cell(
        cell_type="chart", context="", meta=c_meta, commit=False, session=session
    ).id
    cell_ids.append(c_id)

    c_meta = {
        "title": "Top 10 Countries Score",
        "data": {
            "source_type": "cell_above",
            "transformations": {
                "format": {"agg_col": 0, "series_col": 1, "value_cols": [2]},
                "aggregate": True,
                "switch": False,
            },
        },
        "chart": {
            "type": "histogram",
            "x_axis": {"col_idx": 0, "label": "Year"},
            "y_axis": {
                "label": "Happiness Score",
                "stack": False,
                "series": {
                    "0": {"agg_type": "sum"},
                    "1": {"color": 12, "agg_type": "sum"},
                    "2": {"color": 5, "agg_type": "sum"},
                    "3": {"color": 14, "agg_type": "sum"},
                    "4": {"color": 3, "agg_type": "sum"},
                    "5": {"color": 13, "agg_type": "sum"},
                    "6": {"color": 6, "agg_type": "sum"},
                    "7": {"color": 9, "agg_type": "sum"},
                    "8": {"color": 0, "agg_type": "sum"},
                    "9": {"color": 4, "agg_type": "sum"},
                    "10": {"color": 11, "agg_type": "sum"},
                    "11": {"color": 2, "agg_type": "sum"},
                },
            },
        },
        "visual": {"legend_position": "top"},
        "collapsed": False,
    }
    c_id = data_doc_logic.create_data_cell(
        cell_type="chart", context="", meta=c_meta, commit=False, session=session
    ).id
    cell_ids.append(c_id)

    # populate datadoc
    for idx, cell_id in enumerate(cell_ids):
        data_doc_logic.insert_data_doc_cell(
            data_doc_id=data_doc_id, cell_id=cell_id, index=idx, session=session
        )

    return data_doc_id
