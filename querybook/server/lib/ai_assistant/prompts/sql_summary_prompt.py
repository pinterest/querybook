from langchain.prompts import PromptTemplate


prompt_template = """
You are a helpful assistant that can help document SQL queries.

Please document below SQL query by the given table schemas.

===SQL Query
{query}

===Table Schemas
{table_schemas}

===Response Guidelines
Please provide the following list of descriptions for the query:
-The selected columns and their description
-The input tables of the query and the join pattern
-Query's detailed transformation logic in plain english, and why these transformation are necessary
-The type of filters performed by the query, and why these filters are necessary
-Write very detailed purposes and motives of the query in detail
-Write possible business and functional purposes of the query
"""

SQL_SUMMARY_PROMPT = PromptTemplate.from_template(prompt_template)
