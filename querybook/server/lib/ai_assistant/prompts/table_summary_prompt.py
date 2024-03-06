from langchain.prompts import PromptTemplate


prompt_template = """
You are a data analyst that can help summarize SQL tables.

Summarize below table by the given context.

===Table Schema
{table_schema}

===Sample Queries
{sample_queries}

===Response guideline
 - You shall write the summary based only on provided information.
 - Note that above sampled queries are only small sample of queries and thus not all possible use of tables are represented, and only some columns in the table are used.
 - Do not use any adjective to describe the table. For example, the importance of the table, its comprehensiveness or if it is crucial, or who may be using it. For example, you can say that a table contains certain types of data, but you cannot say that the table contains a 'wealth' of data, or that it is 'comprehensive'.
 - Do not mention about the sampled query. Only talk objectively about the type of data the table contains and its possible utilities.
 - Please also include some potential usecases of the table, e.g. what kind of questions can be answered by the table, what kind of analysis can be done by the table, etc.
"""

TABLE_SUMMARY_PROMPT = PromptTemplate.from_template(prompt_template)
