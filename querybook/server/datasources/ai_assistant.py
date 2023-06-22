from flask import Response
from flask_login import current_user
from app.datasource import register

from lib.ai_assistant import ai_assistant


@register("/ai/query_title/", custom_response=True)
def generate_query_title(query):
    title_stream = ai_assistant.generate_title_from_query(
        query=query, user_id=current_user.id
    )

    return Response(title_stream, mimetype="text/event-stream")


@register("/ai/query_auto_fix/", custom_response=True)
def query_auto_fix(query_execution_id):
    res_stream = ai_assistant.query_auto_fix(
        query_execution_id=query_execution_id,
        user_id=current_user.id,
    )

    return Response(res_stream, mimetype="text/event-stream")


@register("/ai/generate_query/", custom_response=True)
def generate_sql_query(
    query_engine_id: int, tables: list[str], question: str, data_cell_id: int = None
):
    res_stream = ai_assistant.generate_sql_query(
        query_engine_id=query_engine_id,
        tables=tables,
        question=question,
        data_cell_id=data_cell_id,
        user_id=current_user.id,
    )

    return Response(res_stream, mimetype="text/event-stream")
