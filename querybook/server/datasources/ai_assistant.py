from logic import ai_assistant
from app.datasource import register


@register("/ai_assistant/text2sql/",  methods=["GET"])
def get_text_to_sql(text=None, tables=None):
    sql = ai_assistant.get_text_to_sql(text=text, tables=tables)
    return sql or None


@register("/ai_assistant/sql2text/",  methods=["GET"])
def get_sql_to_text(query=None):
    text = ai_assistant.get_sql_to_text(sql=query)
    return text or None


@register("/ai_assistant/recommend_tables/", methods=["GET"])
def table_recommendation(question=None):
    tables = ai_assistant.recommend_tables(question)
    return tables
