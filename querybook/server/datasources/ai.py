from flask import Response, request, stream_with_context
from logic import ai
from app.datasource import register


@register("/ai/edit_query/", methods=["POST"])
def edit_query(question=None, query=""):
    return ai.edit_query(question, query)


@register("/ai/edit_query_stream/", methods=["POST"], custom_response=True)
def edit_query_stream(question=None, query=""):
    def event_stream():
        for line in ai.edit_query_stream(question, query):
            text = line.choices[0].delta.get("content", "")
            if len(text):
                yield text

    return Response(event_stream(), mimetype="text/event-stream")


@register("/ai/text2sql/", methods=["POST"], custom_response=True)
def get_text_to_sql(
    question: str = None,
    tables=[],
    metastore_id=None,
    query_engine_id=None,
):
    def event_stream(stream):
        for line in stream:
            text = line.choices[0].delta.get("content", "")
            if len(text):
                yield text

    # sql = ai.get_text_to_sql(text=text, tables=tables)
    if len(tables) == 0:
        table_stream = ai.find_tables(
            question=question,
            metastore_id=1,
        )
        return Response(
            event_stream(table_stream),
            mimetype="text/event-stream",
        )

    sql_stream = ai.text_to_sql_v2(
        question=question,
        tables=tables,
        metastore_id=1,
        query_engine_id=query_engine_id,
    )
    return Response(
        event_stream(sql_stream),
        mimetype="text/event-stream",
    )


@register("/ai/generate_title/", methods=["POST"], custom_response=True)
def generate_query_title(query=None):
    title = ai.get_title(query, stream=True)
    return Response(title, mimetype="text/event-stream")


@register("/ai/auto_fix/", methods=["POST"])
def query_auto_fix(query=None):
    return ai.auto_fix(query)


@register("/ai/auto_fix_stream/", methods=["POST"], custom_response=True)
def query_auto_fix_stream(query=None, error=None):
    def event_stream():
        for line in ai.auto_fix_stream(query, error):
            text = line.choices[0].delta.get("content", "")
            if len(text):
                yield text

    return Response(event_stream(), mimetype="text/event-stream")


@register("/ai/auto_chart/", methods=["POST"])
def auto_chart(data, meta, question):
    return ai.auto_chart(data, config=meta.get("chart"), question=question)
