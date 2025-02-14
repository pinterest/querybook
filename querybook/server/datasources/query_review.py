from flask_login import current_user
from app.datasource import register
from lib.logger import get_logger
from logic import query_review as logic

LOG = get_logger(__file__)


@register("/query_review/created_by_me/", methods=["GET"])
def get_reviews_created_by_me(limit: int, offset: int):
    """Get paginated query reviews where the current user is the creator"""
    reviews = logic.get_reviews_created_by_user(
        user_id=current_user.id, limit=limit, offset=offset
    )
    return [review.to_dict(with_execution=True) for review in reviews]


@register("/query_review/assigned_to_me/", methods=["GET"])
def get_reviews_assigned_to_me(limit: int, offset: int):
    """Get paginated query reviews where the current user is an assigned reviewer"""
    reviews = logic.get_reviews_assigned_to_user(
        user_id=current_user.id, limit=limit, offset=offset
    )
    return [review.to_dict(with_execution=True) for review in reviews]
