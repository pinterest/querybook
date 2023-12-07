from const.ai_assistant import AI_ASSISTANT_NAMESPACE, AICommandType
from lib.ai_assistant import ai_assistant

from .helper import register_socket


@register_socket(AICommandType.TEXT_TO_SQL.value, namespace=AI_ASSISTANT_NAMESPACE)
def text_to_sql(payload={}):
    original_query = payload["original_query"]
    query_engine_id = payload["query_engine_id"]
    tables = payload.get("tables", [])
    question = payload["question"]
    ai_assistant.generate_sql_query(
        query_engine_id=query_engine_id,
        tables=tables,
        question=question,
        original_query=original_query,
    )


@register_socket(AICommandType.SQL_TITLE.value, namespace=AI_ASSISTANT_NAMESPACE)
def sql_title(payload={}):
    query = payload["query"]
    ai_assistant.generate_title_from_query(query=query)


@register_socket(AICommandType.SQL_FIX.value, namespace=AI_ASSISTANT_NAMESPACE)
def sql_fix(payload={}):
    query_execution_id = payload["query_execution_id"]
    ai_assistant.query_auto_fix(
        query_execution_id=query_execution_id,
    )
