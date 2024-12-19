from app.datasource import api_assert
from const.datasources import (
    INVALID_SEMANTIC_STATUS_CODE,
    RESOURCE_NOT_FOUND_STATUS_CODE,
)
from lib.query_review.utils import (
    notify_reviewers_of_new_request,
)
from logic import query_review as logic, query_execution as qe_logic
from const.query_execution import PeerReviewParamsDict, QueryExecutionStatus
from tasks.run_query import run_query_task


def validate_reviewer_permission(query_review_id: int, reviewer_id: int, session):
    """
    Helper function to validate reviewer permissions.
    """
    query_review = logic.get_query_review(query_review_id, session=session)
    api_assert(
        query_review is not None,
        f"QueryReview with id {query_review_id} does not exist.",
        RESOURCE_NOT_FOUND_STATUS_CODE,
    )
    current_status = query_review.get_status()
    api_assert(
        current_status == "pending",
        "This review has already been processed.",
        INVALID_SEMANTIC_STATUS_CODE,
    )
    api_assert(
        reviewer_id in [reviewer.id for reviewer in query_review.assigned_reviewers],
        "You are not assigned as a reviewer for this query.",
    )
    return query_review


class BaseQueryReviewHandler:
    def initiate_query_peer_review_workflow(
        self,
        query_execution_id: int,
        uid: int,
        peer_review_params: PeerReviewParamsDict,
        session=None,
    ):
        """
        Initiates the query peer review workflow by creating a QueryReview,
        assigning reviewers, and sending notifications.
        """
        reviewer_ids = peer_review_params["reviewer_ids"]
        request_reason = peer_review_params["request_reason"]

        if uid in reviewer_ids:
            api_assert(
                False,
                "You cannot assign yourself as a reviewer.",
                INVALID_SEMANTIC_STATUS_CODE,
            )

        query_review = logic.create_query_review(
            query_execution_id=query_execution_id,
            request_reason=request_reason,
            reviewer_ids=reviewer_ids,
            session=session,
        )
        notify_reviewers_of_new_request(
            query_review_id=query_review.id,
            uid=uid,
            session=session,
        )
        return query_review.to_dict()

    def approve_review(self, query_review_id: int, reviewer_id: int, session=None):
        query_review = validate_reviewer_permission(
            query_review_id, reviewer_id, session
        )
        query_execution = query_review.query_execution

        logic.update_query_review(
            query_review_id=query_review_id,
            reviewed_by=reviewer_id,
            commit=False,
            session=session,
        )

        # Update query execution status to INITIALIZED (approved)
        qe_logic.update_query_execution(
            query_execution_id=query_execution.id,
            status=QueryExecutionStatus.INITIALIZED,
            commit=False,
            session=session,
        )

        session.commit()

        # Start the query execution immediately after approval
        run_query_task.apply_async(
            args=[
                query_execution.id,
            ]
        )

        # Perform any additional approval actions (can be overridden)
        self._additional_approval_actions(query_review_id, reviewer_id, session)

        # TODO: notify_query_author_of_approval

    def reject_review(
        self,
        query_review_id: int,
        reviewer_id: int,
        rejection_reason: str,
        session=None,
    ):
        query_review = validate_reviewer_permission(
            query_review_id, reviewer_id, session
        )
        query_execution = query_review.query_execution

        logic.update_query_review(
            query_review_id=query_review_id,
            reviewed_by=reviewer_id,
            rejection_reason=rejection_reason,
            commit=False,
            session=session,
        )

        # Update query execution status to REJECTED
        qe_logic.update_query_execution(
            query_execution_id=query_execution.id,
            status=QueryExecutionStatus.REJECTED,
            commit=False,
            session=session,
        )

        session.commit()

        # TODO: notify_query_author_of_rejection

    def _additional_approval_actions(
        self, query_review_id: int, reviewer_id: int, session=None
    ):
        """
        Optional method to perform additional actions upon approval.
        For open-source, this is a no-op.
        """
        pass
