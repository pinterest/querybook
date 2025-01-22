import { Dispatch } from 'redux';

import { QueryReviewResource } from 'resource/queryReview';

import {
    FETCH_ASSIGNED_REVIEWS_FAILURE,
    FETCH_ASSIGNED_REVIEWS_REQUEST,
    FETCH_ASSIGNED_REVIEWS_SUCCESS,
    FETCH_MY_REVIEWS_FAILURE,
    FETCH_MY_REVIEWS_REQUEST,
    FETCH_MY_REVIEWS_SUCCESS,
    QueryReviewAction,
    SET_ACTIVE_TAB,
    ThunkResult,
} from './types';

export const fetchMyReviews =
    (): ThunkResult<void> => async (dispatch: Dispatch<QueryReviewAction>) => {
        try {
            dispatch({ type: FETCH_MY_REVIEWS_REQUEST });
            const reviews = await QueryReviewResource.getReviewsCreatedByMe();
            dispatch({
                type: FETCH_MY_REVIEWS_SUCCESS,
                payload: reviews.data,
            });
        } catch (error) {
            dispatch({
                type: FETCH_MY_REVIEWS_FAILURE,
                payload: error.message,
            });
        }
    };

export const fetchAssignedReviews =
    (): ThunkResult<void> => async (dispatch: Dispatch<QueryReviewAction>) => {
        try {
            dispatch({ type: FETCH_ASSIGNED_REVIEWS_REQUEST });
            const reviews = await QueryReviewResource.getReviewsAssignedToMe();
            dispatch({
                type: FETCH_ASSIGNED_REVIEWS_SUCCESS,
                payload: reviews.data,
            });
        } catch (error) {
            dispatch({
                type: FETCH_ASSIGNED_REVIEWS_FAILURE,
                payload: error.message,
            });
        }
    };

export const setActiveTab = (
    tab: 'myReviews' | 'assigned'
): QueryReviewAction => ({
    type: SET_ACTIVE_TAB,
    payload: tab,
});
