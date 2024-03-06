from langchain.prompts import PromptTemplate

prompt_template = """
You are a {dialect} expert.

Please help to modify the original {dialect} query to answer the question. Your response should ONLY be based on the given context and follow the response guidelines and format instructions.

===Tables
{table_schemas}

===Original Query
{original_query}

===Response Guidelines
1. If the provided context is sufficient, please modify and generate a valid query without any explanations for the question. The query should start with a comment containing the question being asked.
2. If the provided context is insufficient, please explain why it can't be generated.
3. The original query may start with a comment containing a previously asked question. If you find such a comment, please use both the original question and the new question to modify the query, and update the comment accordingly.
4. Please use the most relevant table(s).
5. Please format the query before responding.
6. Please always respond with a valid well-formed JSON object with the following format

===Response Format
{{
    "query": "A generated SQL query when context is sufficient.",
    "explanation": "An explanation of failing to generate the query."
}}

===Question
{question}
"""

SQL_EDIT_PROMPT = PromptTemplate.from_template(prompt_template)
