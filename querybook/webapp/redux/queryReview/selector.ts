import { createSelector } from 'reselect';

import { IStoreState } from '../store/types';
import { queryEngineSelector } from 'redux/queryEngine/selector';

const selectQueryReviewState = (state: IStoreState) => state.queryReview;

export const selectMyReviews = createSelector(
    selectQueryReviewState,
    (queryReview) => queryReview.myReviews
);

export const selectAssignedReviews = createSelector(
    selectQueryReviewState,
    (queryReview) => queryReview.assignedReviews
);

export const selectLoadingMyReviews = createSelector(
    selectQueryReviewState,
    (queryReview) => queryReview.loadingMyReviews
);

export const selectLoadingAssignedReviews = createSelector(
    selectQueryReviewState,
    (queryReview) => queryReview.loadingAssignedReviews
);

export const selectErrorMyReviews = createSelector(
    selectQueryReviewState,
    (queryReview) => queryReview.errorMyReviews
);

export const selectErrorAssignedReviews = createSelector(
    selectQueryReviewState,
    (queryReview) => queryReview.errorAssignedReviews
);

export const hasEnabledPeerReviewEngineSelector = createSelector(
    queryEngineSelector,
    (queryEngines): boolean =>
        queryEngines.some((engine) =>
            Boolean(engine?.feature_params?.peer_review)
        )
);

export const selectMyReviewsPage = createSelector(
    selectQueryReviewState,
    (queryReview) => queryReview.myReviewsPage
);

export const selectAssignedReviewsPage = createSelector(
    selectQueryReviewState,
    (queryReview) => queryReview.assignedReviewsPage
);

export const selectMyReviewsHasMore = createSelector(
    selectQueryReviewState,
    (queryReview) => queryReview.myReviewsHasMore
);

export const selectAssignedReviewsHasMore = createSelector(
    selectQueryReviewState,
    (queryReview) => queryReview.assignedReviewsHasMore
);
