from langchain.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)


system_message_template = (
    """You are a helpful assistant that can summerize SQL queries."""
)

human_message_template = (
    "Generate a brief 10-word-maximum title for the SQL query below. "
    "===Query\n"
    "{query}\n\n"
    "===Response Guidelines\n"
    "1. Only respond with the title without any explanation\n"
    "2. Dont use double quotes to enclose the title\n"
    "3. Dont add a final period to the title\n\n"
    "===Example response\n"
    "This is a title\n"
)

PROMPT = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(system_message_template),
        HumanMessagePromptTemplate.from_template(human_message_template),
    ]
)
