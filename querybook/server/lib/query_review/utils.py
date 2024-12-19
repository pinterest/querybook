from app.db import with_session
from env import QuerybookSettings
from lib.notify.utils import notify_user
from logic import query_review as logic, user as user_logic
from logic.query_execution import get_environments_by_execution_id


def get_query_execution_url(query_execution_id: int, session=None) -> str:
    """
    Constructs the query execution URL based on environment.
    """
    execution_envs = get_environments_by_execution_id(
        query_execution_id, session=session
    )
    env = execution_envs[0] if execution_envs else None
    return (
        f"{QuerybookSettings.PUBLIC_URL}/{env.name}/query_execution/{query_execution_id}/"
        if env
        else None
    )


@with_session
def notify_reviewers_of_new_request(
    query_review_id: int,
    uid: int,
    session=None,
):
    """
    Notifies assigned reviewers of a new review request.
    """
    query_review = logic.get_query_review(query_review_id, session=session)
    if not query_review:
        return

    user = user_logic.get_user_by_id(uid, session=session)
    requested_by = user.get_name() if user else "User"

    execution_url = get_query_execution_url(
        query_execution_id=query_review.query_execution_id,
        session=session,
    )

    template_params = {
        "requested_by": requested_by,
        "requested_at": query_review.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "query_execution_url": execution_url,
        "review_request_reason": query_review.request_reason,
    }
    for reviewer in query_review.assigned_reviewers:
        notify_user(
            user=reviewer,
            template_name="query_review_request",
            template_params=template_params,
            session=session,
        )
