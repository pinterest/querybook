from flask import Response
from flask_login import current_user
from app.datasource import register

from lib.ai_assistant import ai_assistant


@register("/ai/query_title/", methods=["POST"], custom_response=True)
def generate_query_title(query):
    title_stream = ai_assistant.generate_title_from_query(
        query=query, user_id=current_user.id
    )
    return Response(title_stream, mimetype="text/event-stream")
