from langchain.prompts import PromptTemplate


prompt_template = """
You are a data scientist that can help select the most relevant tables for SQL query tasks.

Please select the most relevant table(s) that can be used to generate SQL query for the question.

===Response Guidelines
- Only return the most relevant table(s).
- Return at most {top_n} tables.
- Response should be a valid JSON array of table names which can be parsed by Python json.loads(). For a single table, the format should be ["table_name"].

===Tables
{table_schemas}

===Question
{question}
"""

TABLE_SELECT_PROMPT = PromptTemplate.from_template(prompt_template)
