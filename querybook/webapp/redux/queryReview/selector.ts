import { createSelector } from 'reselect';

import { IStoreState } from '../store/types';
import { queryEngineSelector } from 'redux/queryEngine/selector';

const selectQueryReviewState = (state: IStoreState) => state.queryReview;

export const selectAssignedReviews = createSelector(
    selectQueryReviewState,
    (queryReview) => queryReview.assignedReviews
);

export const hasEnabledPeerReviewEngineSelector = createSelector(
    queryEngineSelector,
    (queryEngines): boolean =>
        queryEngines.some((engine) =>
            Boolean(engine?.feature_params?.peer_review)
        )
);
