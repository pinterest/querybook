from app.db import with_session

from const.data_element import (
    DataElementTuple,
    DataElementAssociationTuple,
    DataElementAssociationType,
)
from const.schedule import ScheduleTaskType
from lib.lineage.utils import lineage as lineage_logic
from logic import (
    admin as admin_logic,
    environment as environment_logic,
    metastore as m_logic,
    datadoc as data_doc_logic,
    user as user_logic,
    tag as tag_logic,
    data_element as de_logic,
    schedule as schedule_logic,
)
from models.admin import QueryMetastore, QueryEngine
from models.schedule import TaskSchedule


@with_session
def set_up_demo(uid: int, session=None):
    environment = environment_logic.create_environment(
        name="demo_environment",
        description="Demo environment",
        image="",
        public=True,
        commit=False,
        session=session,
    )

    local_db_conn = "sqlite:///demo/demo_data.db"
    metastore_id = QueryMetastore.create(
        {
            "name": "demo_metastore",
            "metastore_params": {
                "connection_string": local_db_conn,
            },
            "loader": "SqlAlchemyMetastoreLoader",
            "acl_control": {},
        },
        commit=False,
        session=session,
    ).id

    engine_id = QueryEngine.create(
        {
            "name": "sqlite",
            "description": "SQLite Engine",
            "language": "sqlite",
            "executor": "sqlalchemy",
            "executor_params": {
                "connection_string": local_db_conn,
            },
            "environment_id": environment.id,
            "metastore_id": metastore_id,
        },
        commit=False,
        session=session,
    ).id

    admin_logic.add_query_engine_to_environment(
        environment.id, engine_id, commit=False, session=session
    )

    task_schedule_id = TaskSchedule.create(
        {
            "name": "update_metastore_{}".format(metastore_id),
            "task": "tasks.update_metastore.update_metastore",
            "cron": "0 0 * * *",
            "args": [metastore_id],
            "task_type": ScheduleTaskType.PROD.value,
            "enabled": True,
        },
        # commit=False,
        session=session,
    ).id
    schedule_logic.run_and_log_scheduled_task(
        scheduled_task_id=task_schedule_id, wait_to_finish=True, session=session
    )

    golden_table = m_logic.get_table_by_name(
        schema_name="main",
        name="world_happiness_2019",
        metastore_id=metastore_id,
        session=session,
    )
    if golden_table:
        m_logic.update_table(id=golden_table.id, golden=True, session=session)
        m_logic.update_table_information(
            data_table_id=golden_table.id,
            description="The World Happiness Report is a landmark survey of the state of global happiness. The first report was published in 2012, the second in 2013, the third in 2015, and the fourth in the 2016 Update. The World Happiness 2017, which ranks 155 countries by their happiness levels, was released at the United Nations at an event celebrating International Day of Happiness on March 20th. The report continues to gain global recognition as governments, organizations and civil society increasingly use happiness indicators to inform their policy-making decisions. Leading experts across fields – economics, psychology, survey analysis, national statistics, health, public policy and more – describe how measurements of well-being can be used effectively to assess the progress of nations. The reports review the state of happiness in the world today and show how the new science of happiness explains personal and national variations in happiness.",
            session=session,
        )
        create_demo_table_stats(table_id=golden_table.id, uid=uid, session=session)
        score_column = m_logic.get_column_by_name(
            name="Score", table_id=golden_table.id, session=session
        )
        create_demo_table_column_stats(
            column_id=score_column.id, uid=uid, session=session
        )

    create_demo_data_elements(metastore_id, session=session)
    create_demo_tags(metastore_id, session=session)

    schedule_logic.run_and_log_scheduled_task(
        scheduled_task_id=task_schedule_id, session=session
    )

    create_demo_lineage(metastore_id, uid, session=session)

    data_doc_id = create_demo_data_doc(
        environment_id=environment.id,
        engine_id=engine_id,
        uid=uid,
        session=session,
    )

    if data_doc_id:
        session.commit()

        return {
            "environment": environment.name,
            "data_doc_id": data_doc_id,
        }


@with_session
def create_demo_table_stats(table_id, uid, session=None):
    m_logic.upsert_table_stat(
        table_id=table_id,
        key="queries_count",
        value=37,
        uid=uid,
        session=session,
    )
    m_logic.upsert_table_stat(
        table_id=table_id,
        key="successful_queries_count",
        value=37,
        uid=uid,
        session=session,
    )
    m_logic.upsert_table_stat(
        table_id=table_id,
        key="users_count",
        value=18,
        uid=uid,
        session=session,
    )
    m_logic.upsert_table_stat(
        table_id=table_id,
        key="join_queries_count",
        value=11,
        uid=uid,
        session=session,
    )


@with_session
def create_demo_table_column_stats(column_id, uid, session=None):
    m_logic.upsert_table_column_stat(
        column_id=column_id,
        key="sum",
        value=843.507,
        uid=uid,
        session=session,
    )
    m_logic.upsert_table_column_stat(
        column_id=column_id,
        key="mean",
        value=5.407,
        uid=uid,
        session=session,
    )
    m_logic.upsert_table_column_stat(
        column_id=column_id,
        key="maximum",
        value=7.769,
        uid=uid,
        session=session,
    )
    m_logic.upsert_table_column_stat(
        column_id=column_id,
        key="minimum",
        value=4.913,
        uid=uid,
        session=session,
    )
    m_logic.upsert_table_column_stat(
        column_id=column_id,
        key="null_value_count",
        value=0,
        uid=uid,
        session=session,
    )


@with_session
def create_demo_lineage(metastore_id, uid, session=None):
    query_text = """CREATE TABLE world_happiness_ranking_2015_to_2019 AS
SELECT
  w5.Country,
  w5.Region,
  w5.HappinessRank AS [Rank2015],
  w6.HappinessRank AS [Rank2016],
  w7.HappinessRank AS [Rank2017],
  w8.Rank AS [Rank2018],
  w9.Rank AS [Rank2019]
FROM
  world_happiness_2019 w9
  INNER JOIN world_happiness_2018 w8 ON w9.Country = w8.Country
  INNER JOIN world_happiness_2017 w7 ON w9.Country = w7.Country
  INNER JOIN world_happiness_2016 w6 ON w9.Country = w6.Country
  INNER JOIN world_happiness_2015 w5 ON w9.Country = w5.Country;
"""
    user = user_logic.get_user_by_id(uid, session=session)
    data_job_metadata = m_logic.create_job_metadata_row(
        job_name="Untitled",
        metastore_id=metastore_id,
        job_info={"source": "demo lineage"},
        job_owner=user.username,
        query_text=query_text,
        is_adhoc=True,
        session=session,
    )
    lineage_logic.create_table_lineage_from_metadata(
        data_job_metadata.id, "sqlite", session=session
    )


@with_session
def create_demo_data_doc(environment_id, engine_id, uid, session=None):
    # create datadoc
    data_doc_id = data_doc_logic.create_data_doc(
        public=True,
        archived=False,
        environment_id=environment_id,
        owner_uid=uid,
        title="World Happiness Report (2015-2019)",
        meta={
            "variables": [
                {"name": "Region", "type": "string", "value": "Western Europe"}
            ]
        },
        session=session,
    ).id
    # create cells
    cell_ids = []

    c_text = '{"blocks":[{"key":"2cd2q","text":"Welcome to Querybook! ","type":"header-one","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"fvpk","text":"This is a demo DataDoc.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"8h6cn","text":"Below are some pre-filled cells for you to interact with.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"e573u","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"3j5jq","text":"This is a text cell that can be used for creating narratives and note-taking.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"64j14","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"cgigd","text":"First, click on the Tables section in the left sidebar to look at the tables we have.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"c0ccn","text":"Click on any table and on VIEW TABLE to inspect.","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":26,"length":10,"style":"BOLD"}],"entityRanges":[],"data":{}},{"key":"a5jq6","text":"To see its relationship to the other tables,  click on the Lineage tab.","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":59,"length":7,"style":"BOLD"}],"entityRanges":[],"data":{}},{"key":"nfd6","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"alj0h","text":"Now, let us get started by clicking on the run button in the query cell below.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}'
    c_meta = {"collapsed": False}
    c_id = data_doc_logic.create_data_cell(
        cell_type="text", context=c_text, meta=c_meta, commit=False, session=session
    ).id
    cell_ids.append(c_id)

    c_query = """SELECT
  Country,
  Rank2015 AS [2015],
  Rank2016 AS [2016],
  Rank2017 AS [2017],
  Rank2018 AS [2018],
  Rank2019 AS [2019]
FROM
  world_happiness_ranking_2015_to_2019
WHERE Region = "{{Region}}";
-- Region is a template variable with the value of 'Western Europe'
-- click on the <> button on the bottom right of the DataDoc to configure more!
    """
    c_meta = {"title": "Western Europe Countries Ranking", "engine": engine_id}
    c_id = data_doc_logic.create_data_cell(
        cell_type="query", context=c_query, meta=c_meta, commit=False, session=session
    ).id
    cell_ids.append(c_id)

    c_text = '{"blocks":[{"key":"ahup0","text":"Chart Cell: Line Graph","type":"header-two","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"tlat","text":"The settings on the chart below has been pre-set to display the results from the query cell above.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"vnl1","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"at9lo","text":"Hover over the chart to see the values in the tooltip.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}'
    c_meta = {"collapsed": False}
    c_id = data_doc_logic.create_data_cell(
        cell_type="text", context=c_text, meta=c_meta, commit=False, session=session
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

    c_text = '{"blocks":[{"key":"4pmfj","text":"Query Cell","type":"header-two","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"9c5lj","text":"Here is another query for you to run!","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"cooab","text":"The results can be shared with other users or exported.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"7nfpk","text":"Check out the controls on the bottom right of the Query Editor.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}'
    c_meta = {"collapsed": False}
    c_id = data_doc_logic.create_data_cell(
        cell_type="text", context=c_text, meta=c_meta, commit=False, session=session
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

    c_text = '{"blocks":[{"key":"asdka","text":"Chart Cell: Bar Charts","type":"header-two","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"1k6fm","text":"You can title, label, and configure the chart to display the results in an easy-to-understand manner.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"86fav","text":"Click on `CONFIG CHART` to see the chart settings & explore.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}'
    c_meta = {"collapsed": False}
    c_id = data_doc_logic.create_data_cell(
        cell_type="text", context=c_text, meta=c_meta, commit=False, session=session
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

    c_text = '{"blocks":[{"key":"cbs69","text":"Query Cell","type":"header-two","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"5ajp","text":"The query cell below has been collapsed. ","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"bvfr2","text":"Query cells can be collapsed in order to make DataDocs easier to view.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"2d2q7","text":"","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"f24oq","text":"Hover over the title Top 10 Countries Score to see the cell management buttons.","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":21,"length":22,"style":"ITALIC"}],"entityRanges":[],"data":{}},{"key":"4kip1","text":"Click on the dropdown button on the top left or on the cell itself to uncollapse the cell and run the query. ","type":"unstyled","depth":0,"inlineStyleRanges":[{"offset":48,"length":11,"style":"BOLD"}],"entityRanges":[],"data":{}},{"key":"c0c7","text":"You can click on the lock button that appears next to the dropdown button to change the default setting of the cell when the DataDoc loads.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}'
    c_meta = {"collapsed": False}
    c_id = data_doc_logic.create_data_cell(
        cell_type="text", context=c_text, meta=c_meta, commit=False, session=session
    ).id
    cell_ids.append(c_id)

    c_query = """{% macro query(year) %}
{% set rank = 'Rank' if year > 2017 else 'HappinessRank' %}
{% set score = 'Score' if year > 2017 else 'HappinessScore as Score' %}
SELECT
  *
FROM(
    SELECT
      '{{ year }}' AS Year,
      Country,
      {{ score }}
    FROM
      world_happiness_{{year}}
    ORDER BY
      {{ rank }}
    LIMIT
      10
  )
{%- endmacro %}
{% for i in [2019, 2018, 2017, 2016, 2015] %}
  {% if loop.index0 != 0 %}
    UNION
  {% endif %}
  {{ query(i) }}
{% endfor %}
ORDER BY
Score DESC;
  -- This is another example of templating!
  -- Check out: https://jinja.palletsprojects.com/en/2.11.x/templates/
  --    for more usages and information!"""
    c_meta = {
        "title": "Top 10 Countries Score",
        "engine": engine_id,
        "collapsed": False,
    }
    c_id = data_doc_logic.create_data_cell(
        cell_type="query", context=c_query, meta=c_meta, commit=False, session=session
    ).id
    cell_ids.append(c_id)

    c_text = '{"blocks":[{"key":"ds1ln","text":"Chart Cells: Multiple Charts from Results","type":"header-two","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"3opak","text":"The results from a query cell can be manipulated to visualize the data in different ways.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"cnu9f","text":"Below are two examples of the same data.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}},{"key":"anuvc","text":"Check out the configurations to see how the data was transformed.","type":"unstyled","depth":0,"inlineStyleRanges":[],"entityRanges":[],"data":{}}],"entityMap":{}}'
    c_meta = {"collapsed": False}
    c_id = data_doc_logic.create_data_cell(
        cell_type="text", context=c_text, meta=c_meta, commit=False, session=session
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

    # create snippet
    snippet_context = """SELECT
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
  INNER JOIN world_happiness_2015 w5 ON w9.Country = w5.Country;"""
    data_doc_logic.create_snippet(
        created_by=uid,
        context=snippet_context,
        title="Join World Happiness Tables",
        engine_id=engine_id,
        description="A template for joining World Happiness Tables from 2015 to 2019.",
        is_public=True,
        golden=True,
        session=session,
    )

    return data_doc_id


@with_session
def create_demo_tags(metastore_id: int, session=None):
    table = m_logic.get_table_by_name(
        schema_name="main",
        name="world_happiness_2019",
        metastore_id=metastore_id,
        session=session,
    )
    tag = tag_logic.create_or_update_tag(
        tag_name="latest", commit=False, session=session
    )
    tag_logic.add_tag_to_table(table.id, tag.name, uid=1, session=session)
    session.commit()


@with_session
def create_demo_data_elements(metastore_id: int, session=None):
    first_user = user_logic.get_user_by_id(1, session=session)
    de_tuple = DataElementTuple(
        name="Country",
        type="STRING",
        description="Contains all plain country names",
        properties={},
        created_by=first_user.username,
    )

    data_element = de_logic.create_or_update_data_element(
        metastore_id, data_element_tuple=de_tuple, commit=False, session=session
    )

    for year in range(2015, 2020):
        table = m_logic.get_table_by_name(
            schema_name="main",
            name=f"world_happiness_{year}",
            metastore_id=metastore_id,
            session=session,
        )
        column = m_logic.get_column_by_name(
            name="Country", table_id=table.id, session=session
        )
        de_association = DataElementAssociationTuple(
            type=DataElementAssociationType.REF,
            value_data_element=data_element.name,
        )
        de_logic.create_column_data_element_association(
            metastore_id,
            column.id,
            data_element_association=de_association,
            commit=False,
            session=session,
        )
    session.commit()
