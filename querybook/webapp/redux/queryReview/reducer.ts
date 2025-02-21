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
import { ReviewType } from 'resource/queryReview';

const initialState: IQueryReviewState = {
    myReviews: [],
    assignedReviews: [],
    loadingMyReviews: false,
    loadingAssignedReviews: false,
    errorMyReviews: null,
    errorAssignedReviews: null,
    activeTab: ReviewType.CREATED,

    // pagination state
    currentPage: 0,
    hasMore: true,
};

export default function queryReviewReducer(
    state = initialState,
    action: QueryReviewAction
): IQueryReviewState {
    return produce(state, (draft) => {
        switch (action.type) {
            case FETCH_MY_REVIEWS_REQUEST:
                draft.loadingMyReviews = true;
                draft.errorMyReviews = null;
                break;

            case FETCH_MY_REVIEWS_SUCCESS:
                draft.loadingMyReviews = false;
                draft.myReviews =
                    action.payload.page === 0
                        ? action.payload.reviews
                        : [...state.myReviews, ...action.payload.reviews];
                draft.currentPage = action.payload.page;
                draft.hasMore = action.payload.hasMore;
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
                draft.assignedReviews =
                    action.payload.page === 0
                        ? action.payload.reviews
                        : [...state.assignedReviews, ...action.payload.reviews];
                draft.currentPage = action.payload.page;
                draft.hasMore = action.payload.hasMore;
                break;

            case FETCH_ASSIGNED_REVIEWS_FAILURE:
                draft.loadingAssignedReviews = false;
                draft.errorAssignedReviews = action.payload;
                break;

            case SET_ACTIVE_TAB:
                draft.activeTab = action.payload;
                draft.currentPage = 0; // Reset pagination when switching tabs
                draft.hasMore = true;
                break;
        }
    });
}
