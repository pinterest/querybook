from app.db import with_session

import json

import openai

from env import QuerybookSettings

# Set up the OpenAI API client
from env import QuerybookSettings
from lib.logger import get_logger


import os

os.environ["OPENAI_API_KEY"] = QuerybookSettings.OPENAI_API_KEY

LOG = get_logger(__file__)

TITLE_GENERATION_PROMPT_TEMPLATE = """Try to explain the below query does and then generate a concise title for. Please only respond the title without any explanation or leading words.
```
{}
```
"""

FIND_TALBE_PROMPT_TEMPLATE = """Please try to find the best tables for the given question
Please respond the tables with below specified format without any explanation.

===Response format
###tables
table_a
table_b

===Context
tables:
main.world_happiness_2019
main.world_happiness_2018
main.world_happiness_2017
main.world_happiness_2016
===Question
{}
"""

GENERATE_QUERY_PROMPT_TEMPLATE = """Please write a SQL query for the given question by only using provided information. 
If you feel like the provided tables are not enough, please ask for more information.

===SQL Dialect
{}

===Table schema:
{}

===Question:
{}

===
Please only respond the query without any explanation in below specified format

===Response format
###query
select * from table_a

"""

EDIT_QUERY_PROMPT_TEMPLATE = """Please update the original query for the given question. Please only respond the query without any explanation
===
Table schema:
{}
===
Original query:
{}
===
Question:
{}
"""

CHART_CONFIG_PROMPT_TEMPLATE = """Given below data and current config, help on the question.
===Config types
type ChartType =
    | 'line'
    | 'area'
    | 'bar'
    | 'histogram'
    | 'pie'
    | 'doughnut'
    | 'scatter'
    | 'bubble'
    | 'table';
interface IChartAxisMeta {{
    label: string;
    scale?: ChartScaleType;
    min?: number;
    max?: number;
    format?: ChartScaleFormat;
}}
interface IChartSeriesMeta {{
    source?: number;
    hidden?: boolean;
    color?: number;
    agg_type?: ChartDataAggType;
}}
interface IChartYAxisMeta extends IChartAxisMeta {{
    series?: Record<number, IChartSeriesMeta>;
    stack?: boolean;
}}
===Data
{}
===Current config
{}
===Question
{}
===Response format
please only respond in the specified JSON format without any explanation, which can be loaded by json.loads
{{
    chartType: ChartType;
    y_axis: IChartYAxisMeta;
}}
"""


def get_title(query, stream=True):
    response = openai.ChatCompletion.create(
        temperature=0.1,
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a SQL expert"},
            {"role": "user", "content": TITLE_GENERATION_PROMPT_TEMPLATE.format(query)},
        ],
        stream=stream,
    )

    if not stream:
        return response.choices[0].message.get("content", "")

    def event_stream():
        for line in response:
            text = line.choices[0].delta.get("content", "")
            if len(text):
                yield text

    return event_stream()


def auto_chart(data, config, question):
    question = question or "what is the recommend chat config to visualize below data"
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        temperature=0.1,
        messages=[
            {"role": "system", "content": "You are an expert of data visualization."},
            {
                "role": "user",
                "content": CHART_CONFIG_PROMPT_TEMPLATE.format(data, config, question),
            },
        ],
    )
    return json.loads(response.choices[0].message.content)


def auto_fix(query):
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        temperature=0.1,
        messages=[
            {"role": "system", "content": "You are a SQL expert."},
            {
                "role": "user",
                "content": f"Please try to detect any errors in below query and fix it. Only respond with the fixed query without any explanation.\n===\n{query}\n",
            },
        ],
    )
    return response.choices[0].message.content


def auto_fix_stream(query, error):
    return openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        temperature=0.1,
        messages=[
            {"role": "system", "content": "You are an expert of Presto and SparkSQL."},
            {
                "role": "user",
                "content": f"Please try to fix below query according to the error. Only respond with the fixed query without any explanation.\n===\nQuery:\n{query}\n===\nError:\n{error}",
            },
        ],
        stream=True,
    )


table_schema = """CREATE TABLE main.world_happiness_2019 (Rank integer,Country text,Score real,GDP real,SocialSupport real,HealthyLifeExpectancy real,FreedomToMakeLifeChoices real,Generosity real,PerceptionsOfCorruption real)"""


def edit_query(question, query):
    prompt = EDIT_QUERY_PROMPT_TEMPLATE.format(table_schema, query, question)
    print(prompt)
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        temperature=0.1,
        messages=[
            {"role": "system", "content": "You are a SQL expert"},
            {
                "role": "user",
                "content": EDIT_QUERY_PROMPT_TEMPLATE.format(
                    table_schema, query, question
                ),
            },
        ],
    )
    return response.choices[0].message.content


def edit_query_stream(question, query):
    prompt = EDIT_QUERY_PROMPT_TEMPLATE.format(table_schema, query, question)
    print(prompt)
    return openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        temperature=0.1,
        messages=[
            {"role": "system", "content": "You are a SQL expert"},
            {
                "role": "user",
                "content": EDIT_QUERY_PROMPT_TEMPLATE.format(
                    table_schema, query, question
                ),
            },
        ],
        stream=True,
    )


def find_tables(question, metastore_id):
    prompt = FIND_TALBE_PROMPT_TEMPLATE.format(question)
    return openai.ChatCompletion.create(
        model="gpt-3.5-turbo-0301",
        temperature=0.1,
        messages=[
            {"role": "system", "content": "You are a SQL expert."},
            {"role": "user", "content": prompt},
        ],
        stream=True,
    )


from logic import metastore as metastore_logic
from logic import admin as admin_logic


@with_session
def text_to_sql_v2(question, metastore_id, query_engine_id, tables, session=None):
    engine = admin_logic.get_query_engine_by_id(query_engine_id, session=session)
    table = metastore_logic.get_table_by_name(
        schema_name=tables[0].split(".")[0],
        name=tables[0].split(".")[1],
        metastore_id=engine.metastore_id,
        session=session,
    )
    print("###############", table.to_dict())
    tables_prompt = """\n
Table Name: {}\n
Table Description: {}\n
Table Columns:
{}
""".format(
        tables[0],
        table.information.description,
        "Name\tType\tDescription\n"
        + "\n".join([f"{c.name}\t{c.type}\t{c.description}" for c in table.columns]),
    )

    prompt = GENERATE_QUERY_PROMPT_TEMPLATE.format(
        engine.language, tables_prompt, question
    )
    print(prompt)
    return openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        temperature=0.1,
        messages=[
            {"role": "system", "content": "You are a SQL expert."},
            {"role": "user", "content": prompt},
        ],
        stream=True,
    )
