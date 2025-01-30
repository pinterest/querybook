import { IQueryReview, QueryExecutionStatus } from 'const/queryExecution';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { IStoreState } from 'redux/store/types';
import {
    queryExecutionSelector,
    queryReviewByExecutionIdSelector,
} from 'redux/queryExecutions/selector';
import { myUserInfoSelector } from 'redux/user/selector';

export interface QueryReviewState {
    status: {
        isPending: boolean;
        isRejected: boolean;
        isApproved: boolean;
    };
    permissions: {
        isReviewer: boolean;
    };
    review: IQueryReview | null;
}

const DEFAULT_REVIEW_STATE: QueryReviewState = {
    status: {
        isPending: false,
        isRejected: false,
        isApproved: false,
    },
    permissions: {
        isReviewer: false,
    },
    review: null,
};

export function useQueryReview(executionId?: number): QueryReviewState {
    const { queryExecution, currentUser, queryReview } = useSelector(
        (state: IStoreState) => ({
            queryExecution: executionId
                ? queryExecutionSelector(state, executionId)
                : null,
            currentUser: myUserInfoSelector(state),
            queryReview: executionId
                ? queryReviewByExecutionIdSelector(state, executionId)
                : null,
        })
    );

    return useMemo(() => {
        if (!executionId || !queryExecution || !queryReview) {
            return DEFAULT_REVIEW_STATE;
        }

        const isPending =
            queryExecution.status === QueryExecutionStatus.PENDING_REVIEW;
        const isRejected =
            queryExecution.status === QueryExecutionStatus.REJECTED;
        const isApproved = !isPending && !isRejected;

        return {
            status: { isPending, isRejected, isApproved },
            permissions: {
                isReviewer: queryReview.reviewer_ids?.includes(currentUser.id),
            },
            review: queryReview,
        };
    }, [executionId, queryExecution, queryReview, currentUser]);
}
