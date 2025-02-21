import { Dispatch } from 'redux';

import { QueryReviewResource, ReviewType } from 'resource/queryReview';

import localStore from 'lib/local-store';

const QUERY_REVIEW_TAB_KEY = 'query_review_active_tab';
const PAGE_SIZE = 10;

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

export const fetchReviews =
    (reviewType: ReviewType, page: number = 0): ThunkResult<Promise<void>> =>
    async (dispatch: Dispatch<QueryReviewAction>) => {
        const isMyReviews = reviewType === ReviewType.CREATED;
        try {
            dispatch({
                type: isMyReviews
                    ? FETCH_MY_REVIEWS_REQUEST
                    : FETCH_ASSIGNED_REVIEWS_REQUEST,
            });

            const reviews = await QueryReviewResource.getReviews(
                reviewType,
                PAGE_SIZE,
                page * PAGE_SIZE
            );

            dispatch({
                type: isMyReviews
                    ? FETCH_MY_REVIEWS_SUCCESS
                    : FETCH_ASSIGNED_REVIEWS_SUCCESS,
                payload: {
                    reviews: reviews.data,
                    hasMore: reviews.data.length === PAGE_SIZE,
                    page,
                },
            });
        } catch (error) {
            dispatch({
                type: isMyReviews
                    ? FETCH_MY_REVIEWS_FAILURE
                    : FETCH_ASSIGNED_REVIEWS_FAILURE,
                payload: error.message,
            });
        }
    };

export const setActiveTab =
    (tab: ReviewType): ThunkResult<void> =>
    async (dispatch) => {
        dispatch({
            type: SET_ACTIVE_TAB,
            payload: tab,
        });
        await localStore.set(QUERY_REVIEW_TAB_KEY, tab);
    };

export const initializeTabFromStorage =
    (): ThunkResult<void> => async (dispatch) => {
        const savedTab = await localStore.get<ReviewType>(QUERY_REVIEW_TAB_KEY);
        if (savedTab) {
            dispatch({
                type: SET_ACTIVE_TAB,
                payload: savedTab,
            });
        }
    };
