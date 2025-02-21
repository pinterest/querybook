from enum import Enum
from flask_login import current_user
from app.datasource import register, api_assert
from lib.logger import get_logger
from logic import query_review as logic

LOG = get_logger(__file__)


class ReviewType(Enum):
    CREATED = "created"
    ASSIGNED = "assigned"


@register("/query_review/<review_type>/", methods=["GET"])
def get_reviews(review_type: str, limit: int, offset: int):
    """Get paginated query reviews based on type (created/assigned)

    Args:
        review_type: Either 'created' or 'assigned'
        limit: Maximum number of reviews to return
        offset: Number of reviews to skip
    """
    try:
        review_type = ReviewType(review_type)
    except ValueError:
        api_assert(False, f"Invalid review type: {review_type}")

    if review_type == ReviewType.CREATED:
        reviews = logic.get_reviews_created_by_user(
            user_id=current_user.id, limit=limit, offset=offset
        )
    else:  # review_type == ReviewType.ASSIGNED
        reviews = logic.get_reviews_assigned_to_user(
            user_id=current_user.id, limit=limit, offset=offset
        )

    return [review.to_dict(with_execution=True) for review in reviews]
