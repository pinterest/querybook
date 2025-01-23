from typing import Any, Dict, Optional
from datetime import datetime
from app.db import with_session
from env import QuerybookSettings
from lib.notify.utils import notify_user
from logic import query_review as logic, user as user_logic
from logic.query_execution import get_environments_by_execution_id
from models.query_execution import QueryExecution
from models.query_review import QueryReview


def _format_timestamp(dt: datetime) -> str:
    """Format datetime for notifications.

    Args:
        dt: Datetime to format
    Returns:
        str: Formatted timestamp string
    """
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def get_query_execution_url(query_execution_id: int, session=None) -> Optional[str]:
    """Construct query execution URL.

    Args:
        query_execution_id: ID of query execution
        session: Database session
    Returns:
        Optional[str]: Full URL or None if environment not found
    """
    execution_envs = get_environments_by_execution_id(
        query_execution_id, session=session
    )
    if not execution_envs:
        return None

    env = execution_envs[0]
    return f"{QuerybookSettings.PUBLIC_URL}/{env.name}/query_execution/{query_execution_id}/"


@with_session
def notify_reviewers_of_new_request(
    query_review_id: int,
    uid: int,
    template_name: str,
    additional_params: Dict[str, Any],
    session=None,
) -> None:
    """Notify reviewers about new review request."""
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
        "requested_at": _format_timestamp(query_review.created_at),
        "query_execution_url": execution_url,
        "review_request_reason": query_review.request_reason,
        **additional_params,
    }

    for reviewer in query_review.assigned_reviewers:
        notify_user(
            user=reviewer,
            template_name=template_name,
            template_params=template_params,
            session=session,
        )


@with_session
def notify_query_author_of_rejection(
    query_review: QueryReview,
    query_execution: QueryExecution,
    rejection_reason: str,
    reviewer_id: int,
    session=None,
) -> None:
    """Notify query author about rejection."""
    reviewer = user_logic.get_user_by_id(reviewer_id, session=session)
    reviewer_name = reviewer.get_name() if reviewer else "Reviewer"

    execution_url = get_query_execution_url(
        query_execution_id=query_execution.id,
        session=session,
    )

    template_params = {
        "reviewer_name": reviewer_name,
        "query_execution_url": execution_url,
        "rejection_reason": rejection_reason,
        "query_execution_id": query_execution.id,
        "rejected_at": _format_timestamp(query_review.updated_at),
    }

    notify_user(
        user=query_execution.owner,
        template_name="query_review_rejected",
        template_params=template_params,
        session=session,
    )


@with_session
def notify_query_author_of_approval(
    query_review: QueryReview,
    query_execution: QueryExecution,
    reviewer_id: int,
    session=None,
) -> None:
    """Notify query author about approval."""
    reviewer = user_logic.get_user_by_id(reviewer_id, session=session)
    reviewer_name = reviewer.get_name() if reviewer else "Reviewer"

    execution_url = get_query_execution_url(
        query_execution_id=query_execution.id,
        session=session,
    )

    template_params = {
        "reviewer_name": reviewer_name,
        "query_execution_url": execution_url,
        "approved_at": _format_timestamp(query_review.updated_at),
    }

    notify_user(
        user=query_execution.owner,
        template_name="query_review_approved",
        template_params=template_params,
        session=session,
    )
