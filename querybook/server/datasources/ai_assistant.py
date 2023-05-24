from flask import Response
from app.datasource import register

from lib.ai_assistant import ai_assistant


@register("/ai/query_title/", methods=["POST"], custom_response=True)
def generate_query_title(query=None, stream=True):
    title = ai_assistant.generate_title_from_query(query, stream=stream)
    if stream:
        return Response(title, mimetype="text/event-stream")
    else:
        return title
