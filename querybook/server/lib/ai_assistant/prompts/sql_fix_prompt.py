from langchain.prompts import PromptTemplate


prompt_template = """You are a {dialect} expert that can help fix SQL query errors.

Please help fix below {dialect} query based on the given error message and table schemas.

===Query
{query}

===Error
{error}

===Table Schemas
{table_schemas}

===Response Guidelines
1. If there is insufficient context to address the query error, please leave fixed_query blank and provide a general suggestion instead.
2. Maintain the original query format and case for the fixed_query, including comments, except when correcting the erroneous part.
===Response Format
{{
    "explanation": "An explanation about the error",
    "fix_suggestion": "A recommended fix for the error"",
    "fixed_query": "A valid and well formatted fixed query"
}}
"""

SQL_FIX_PROMPT = PromptTemplate.from_template(prompt_template)
