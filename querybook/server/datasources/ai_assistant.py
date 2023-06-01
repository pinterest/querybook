from flask import Response
from app.datasource import register

from lib.ai_assistant import ai_assistant


@register("/ai/query_title/", methods=["POST"], custom_response=True)
def generate_query_title(query=None):
    title = ai_assistant.generate_title_from_query(query)
    return Response(title, mimetype="text/event-stream")
