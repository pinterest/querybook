from abc import ABCMeta, abstractmethod
from typing import Any, Dict, Tuple
from app.datasource import api_assert
from app.db import with_session
from const.datasources import (
    INVALID_SEMANTIC_STATUS_CODE,
    RESOURCE_NOT_FOUND_STATUS_CODE,
)
from lib.logger import get_logger
from lib.query_review.utils import (
    notify_query_author_of_approval,
    notify_query_author_of_rejection,
    notify_reviewers_of_new_request,
)
from logic import query_review as logic, query_execution as qe_logic
from const.query_execution import PeerReviewParamsDict, QueryExecutionStatus
from models.query_execution import QueryExecution
from models.query_review import QueryReview
from tasks.run_query import run_query_task

LOG = get_logger(__file__)


class BaseQueryReviewHandler(metaclass=ABCMeta):
    """
    Abstract base class for query review handlers.

    Required Overrides:
        - _additional_approval_actions: Custom post-approval logic

    Optional Overrides:
        - notification_template: Override to customize notification template
        - notification_template_params: Override to add custom parameters
    """

    @property
    def notification_template(self) -> str:
        """Template used for notifications.
        Defaults to 'query_review_request'.
        Override to customize."""
        return "query_review_request"

    @property
    def notification_template_params(self) -> Dict[str, Any]:
        """Additional parameters for notification template.
        Override to provide custom parameters."""
        return {}

    @abstractmethod
    def _additional_approval_actions(
        self, query_review_id: int, reviewer_id: int, session=None
    ) -> None:
        """Custom post-approval actions"""
        raise NotImplementedError()

    def initiate_query_peer_review_workflow(
        self,
        query_execution_id: int,
        uid: int,
        peer_review_params: PeerReviewParamsDict,
        session=None,
    ) -> Dict[str, Any]:
        """
        Initiates the query peer review workflow.

        Creates a review record and notifies reviewers.

        Args:
            query_execution_id (int): ID of the query execution.
            uid (int): ID of the user initiating the review.
            peer_review_params (PeerReviewParamsDict): Parameters for peer review.
            session: Database session.

        Returns:
            Dict[str, Any]: Dictionary representation of the created query review.
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
            template_name=self.notification_template,
            additional_params=self.notification_template_params,
            session=session,
        )

        return query_review.to_dict()

    def _validate_review(
        self, query_execution_id: int, reviewer_id: int, session=None
    ) -> Tuple[QueryExecution, QueryReview]:
        """
        Validate review request and permissions.

        Performs all necessary validation checks:
        1. Query execution exists
        2. Review exists and is pending
        3. Reviewer has permission

        Args:
            query_execution_id (int): ID of the query execution.
            reviewer_id (int): ID of the reviewing user.
            session: Database session.

        Returns:
            Tuple[QueryExecution, QueryReview]: The query execution and review objects.

        Raises:
            ValueError: If any validation fails.
        """
        query_execution = qe_logic.get_query_execution_by_id(
            query_execution_id, session=session
        )
        api_assert(
            query_execution is not None,
            f"QueryExecution with id {query_execution_id} does not exist.",
            RESOURCE_NOT_FOUND_STATUS_CODE,
        )

        query_review = query_execution.review
        api_assert(
            query_review is not None,
            "Review not found",
            RESOURCE_NOT_FOUND_STATUS_CODE,
        )

        api_assert(
            query_execution.status == QueryExecutionStatus.PENDING_REVIEW,
            "This review has already been processed.",
            INVALID_SEMANTIC_STATUS_CODE,
        )

        api_assert(
            reviewer_id in [r.id for r in query_review.assigned_reviewers],
            "You are not assigned as a reviewer for this query.",
            INVALID_SEMANTIC_STATUS_CODE,
        )

        return query_execution, query_review

    @with_session
    def approve_review(
        self, query_execution_id: int, reviewer_id: int, session=None
    ) -> QueryExecution:
        """Approves a review request and initiates query execution."""
        try:
            # 1. Validate review
            query_execution, query_review = self._validate_review(
                query_execution_id, reviewer_id, session
            )

            # 2. Update review status
            logic.update_query_review(
                query_review_id=query_review.id,
                reviewed_by=reviewer_id,
                commit=False,
                session=session,
            )

            # 3. Update execution status
            qe_logic.update_query_execution(
                query_execution_id=query_execution.id,
                status=QueryExecutionStatus.INITIALIZED,
                commit=False,
                session=session,
            )

            # 4. Run  approval actions
            self._additional_approval_actions(
                query_review.id, reviewer_id, session=session
            )

            session.commit()

            run_query_task.apply_async(args=[query_execution.id])
            notify_query_author_of_approval(
                query_review=query_review,
                query_execution=query_execution,
                reviewer_id=reviewer_id,
                session=session,
            )

            return query_execution

        except Exception as e:
            LOG.error(f"approve_review failed: {str(e)}")
            session.rollback()
            raise

    @with_session
    def reject_review(
        self,
        query_execution_id: int,
        reviewer_id: int,
        rejection_reason: str,
        session=None,
    ) -> QueryExecution:
        """
        Reject a review request and notifies review author.

        Args:
            query_execution_id (int): ID of the query execution.
            reviewer_id (int): ID of the reviewing user.
            rejection_reason (str): Reason for rejection.
            session: Database session.

        Returns:
            QueryExecution: The updated query execution object.
        """
        query_execution, query_review = self._validate_review(
            query_execution_id, reviewer_id, session
        )

        # Update review status
        logic.update_query_review(
            query_review_id=query_review.id,
            reviewed_by=reviewer_id,
            rejection_reason=rejection_reason,
            commit=False,
            session=session,
        )

        # Update execution status
        qe_logic.update_query_execution(
            query_execution_id=query_execution.id,
            status=QueryExecutionStatus.REJECTED,
            commit=False,
            session=session,
        )

        session.commit()

        notify_query_author_of_rejection(
            query_review=query_review,
            query_execution=query_execution,
            reviewer_id=reviewer_id,
            rejection_reason=rejection_reason,
            session=session,
        )

        return query_execution
