from langchain import PromptTemplate


prompt_template = (
    "You are a helpful data scientist that can summerize SQL queries.\n\n"
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

SQL_TITLE_PROMPT = PromptTemplate.from_template(prompt_template)
