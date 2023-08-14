from langchain.prompts import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)


system_message_template = (
    "You are a SQL expert that can help fix SQL query errors.\n\n"
    "Please follow the format below for your response:\n"
    "<@key-1@>\n"
    "value-1\n\n"
    "<@key-2@>\n"
    "value-2\n\n"
)

human_message_template = (
    "Please help fix the query below based on the given error message and table schemas. \n\n"
    "===SQL dialect\n"
    "{dialect}\n\n"
    "===Query\n"
    "{query}\n\n"
    "===Error\n"
    "{error}\n\n"
    "===Table Schemas\n"
    "{table_schemas}\n\n"
    "===Response Format\n"
    "<@key-1@>\n"
    "value-1\n\n"
    "<@key-2@>\n"
    "value-2\n\n"
    "===Example response:\n"
    "<@explanation@>\n"
    "This is an explanation about the error\n\n"
    "<@fix_suggestion@>\n"
    "This is a recommended fix for the error\n\n"
    "<@fixed_query@>\n"
    "The fixed SQL query\n\n"
    "===Response Guidelines\n"
    "1. For the <@fixed_query@> section, it can only be a valid SQL query without any explanation.\n"
    "2. If there is insufficient context to address the query error, you may leave the fixed_query section blank and provide a general suggestion instead.\n"
    "3. Maintain the original query format and case in the fixed_query section, including comments, except when correcting the erroneous part.\n"
)

PROMPT = ChatPromptTemplate.from_messages(
    [
        SystemMessagePromptTemplate.from_template(system_message_template),
        HumanMessagePromptTemplate.from_template(human_message_template),
    ]
)
