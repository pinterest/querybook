from lib.query_review.base_query_review_handler import BaseQueryReviewHandler


class DefaultQueryReviewHandler(BaseQueryReviewHandler):
    """
    Default query review handler that does not perform any additional actions.
    """

    def _additional_approval_actions(
        self, query_review_id: int, reviewer_id: int, session=None
    ) -> None:
        """No additional actions required."""
        pass
