from langchain.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)


system_message_template = (
    "You are a helpful assistant that can help summarize SQL tables."
)

human_message_template = """
Please summarize below table by given context. The summary will be used as a reference for table discovery and sql query generation, so please make it as informative as possible.
{table_schema}
"""

TABLE_SUMMARY_PROMPT = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(system_message_template),
        HumanMessagePromptTemplate.from_template(human_message_template),
    ]
)
