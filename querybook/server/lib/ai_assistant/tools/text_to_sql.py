from langchain.prompts import (
    ChatPromptTemplate,
    MessagesPlaceholder,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)


system_message_template = (
    "You are a SQL expert that can help generating SQL query.\n\n"
    "Please help to generate a new SQL query or modify the original query to answer the following question. Your response should ONLY be based on the given context.\n\n"
    "Please always follow the key/value pair format below for your response:\n"
    "===Response Format\n"
    "<@query@>\n"
    "query\n\n"
    "or\n\n"
    "<@explanation@>\n"
    "explanation\n\n"
    "===Example Response:\n"
    "Example 1: Sufficient Context\n"
    "<@query@>\n"
    "A generated SQL query based on the provided context with the asked question at the beginning is provided here.\n\n"
    "Example 2: Insufficient Context\n"
    "<@explanation@>\n"
    "An explanation of the missing context is provided here.\n\n"
    "===Response Guidelines\n"
    "1. If the provided context is sufficient, please respond only with a valid SQL query without any explanations in the <@query@> section. The query should start with a comment containing the question being asked.\n"
    "2. If the provided context is insufficient, please explain what information is missing.\n"
    "3. If the original query is provided, please modify the original query to answer the question. The original query may start with a comment containing a previously asked question. If you find such a comment, please use both the original question and the new question to generate the new query.\n"
    "4. Please always honor the table schmeas for the query generation\n\n"
)

human_message_template = (
    "===SQL Dialect\n"
    "{dialect}\n\n"
    "===Tables\n"
    "{table_schemas}\n\n"
    "===Original Query\n"
    "{original_query}\n\n"
)

PROMPT = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(system_message_template),
        HumanMessagePromptTemplate.from_template(human_message_template),
        MessagesPlaceholder(variable_name="chat_history"),
        HumanMessagePromptTemplate.from_template(
            "{question}\nPlease remember always start your response with <@query@> or <@explanation@>.\n"
        ),
    ]
)
