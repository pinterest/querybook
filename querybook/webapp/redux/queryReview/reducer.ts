import { produce } from 'immer';

import {
    FETCH_ASSIGNED_REVIEWS_FAILURE,
    FETCH_ASSIGNED_REVIEWS_REQUEST,
    FETCH_ASSIGNED_REVIEWS_SUCCESS,
    FETCH_MY_REVIEWS_FAILURE,
    FETCH_MY_REVIEWS_REQUEST,
    FETCH_MY_REVIEWS_SUCCESS,
    IQueryReviewState,
    QueryReviewAction,
    SET_ACTIVE_TAB,
} from './types';

const initialState: IQueryReviewState = {
    myReviews: [],
    assignedReviews: [],
    loadingMyReviews: false,
    loadingAssignedReviews: false,
    errorMyReviews: null,
    errorAssignedReviews: null,
    activeTab: 'myReviews',
};

export const queryReviewReducer = (
    state = initialState,
    action: QueryReviewAction
): IQueryReviewState =>
    produce(state, (draft) => {
        switch (action.type) {
            case FETCH_MY_REVIEWS_REQUEST:
                draft.loadingMyReviews = true;
                draft.errorMyReviews = null;
                break;

            case FETCH_MY_REVIEWS_SUCCESS:
                draft.loadingMyReviews = false;
                draft.myReviews = action.payload;
                break;

            case FETCH_MY_REVIEWS_FAILURE:
                draft.loadingMyReviews = false;
                draft.errorMyReviews = action.payload;
                break;

            case FETCH_ASSIGNED_REVIEWS_REQUEST:
                draft.loadingAssignedReviews = true;
                draft.errorAssignedReviews = null;
                break;

            case FETCH_ASSIGNED_REVIEWS_SUCCESS:
                draft.loadingAssignedReviews = false;
                draft.assignedReviews = action.payload;
                break;

            case FETCH_ASSIGNED_REVIEWS_FAILURE:
                draft.loadingAssignedReviews = false;
                draft.errorAssignedReviews = action.payload;
                break;

            case SET_ACTIVE_TAB:
                draft.activeTab = action.payload;
                break;
        }
    });

export default queryReviewReducer;
