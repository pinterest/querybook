from langchain.prompts import PromptTemplate


prompt_template = """
You are a helpful data scientist that can summarize SQL queries.

Generate a brief 10-word-maximum title for the SQL query below.

===Query
{query}

===Response Format
Please respond in below JSON format:
{{
    "title": "This is a title"
}}
"""

SQL_TITLE_PROMPT = PromptTemplate.from_template(prompt_template)
