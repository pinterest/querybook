from langchain import PromptTemplate


prompt_template = """
You are a data scientist that can help select the most suitable tables for SQL query tasks.

Please select at most top {top_n} tables from tables provided to answer the question below.
Please response in a valid JSON array format with table names which can be parsed by Python json.loads().

===Tables
{table_schemas}

===Question
{question}
"""

TABLE_SELECT_PROMPT = PromptTemplate.from_template(prompt_template)
