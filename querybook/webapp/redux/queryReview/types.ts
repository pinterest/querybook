import { Action } from 'redux';
import { ThunkAction } from 'redux-thunk';

import { IQueryReview } from 'const/queryExecution';

import { IStoreState } from '../store/types';

export const FETCH_MY_REVIEWS_REQUEST =
    '@@queryReview/FETCH_MY_REVIEWS_REQUEST';
export const FETCH_MY_REVIEWS_SUCCESS =
    '@@queryReview/FETCH_MY_REVIEWS_SUCCESS';
export const FETCH_MY_REVIEWS_FAILURE =
    '@@queryReview/FETCH_MY_REVIEWS_FAILURE';

export const FETCH_ASSIGNED_REVIEWS_REQUEST =
    '@@queryReview/FETCH_ASSIGNED_REVIEWS_REQUEST';
export const FETCH_ASSIGNED_REVIEWS_SUCCESS =
    '@@queryReview/FETCH_ASSIGNED_REVIEWS_SUCCESS';
export const FETCH_ASSIGNED_REVIEWS_FAILURE =
    '@@queryReview/FETCH_ASSIGNED_REVIEWS_FAILURE';
export const SET_ACTIVE_TAB = '@@queryReview/SET_ACTIVE_TAB';

export interface IQueryReviewState {
    myReviews: IQueryReview[];
    assignedReviews: IQueryReview[];
    loadingMyReviews: boolean;
    loadingAssignedReviews: boolean;
    errorMyReviews: string | null;
    errorAssignedReviews: string | null;
    activeTab: 'myReviews' | 'assigned';

    // pagination state
    currentPage: number;
    hasMore: boolean;
}

interface IReviewsPayload {
    reviews: IQueryReview[];
    hasMore: boolean;
    page: number;
}

interface IFetchMyReviewsRequestAction extends Action {
    type: typeof FETCH_MY_REVIEWS_REQUEST;
}

interface IFetchMyReviewsSuccessAction extends Action {
    type: typeof FETCH_MY_REVIEWS_SUCCESS;
    payload: IReviewsPayload;
}

interface IFetchMyReviewsFailureAction extends Action {
    type: typeof FETCH_MY_REVIEWS_FAILURE;
    payload: string;
}

interface IFetchAssignedReviewsRequestAction extends Action {
    type: typeof FETCH_ASSIGNED_REVIEWS_REQUEST;
}

interface IFetchAssignedReviewsSuccessAction extends Action {
    type: typeof FETCH_ASSIGNED_REVIEWS_SUCCESS;
    payload: IReviewsPayload;
}

interface IFetchAssignedReviewsFailureAction extends Action {
    type: typeof FETCH_ASSIGNED_REVIEWS_FAILURE;
    payload: string;
}

interface ISetActiveTabAction extends Action {
    type: typeof SET_ACTIVE_TAB;
    payload: 'myReviews' | 'assigned';
}

export type QueryReviewAction =
    | IFetchMyReviewsRequestAction
    | IFetchMyReviewsSuccessAction
    | IFetchMyReviewsFailureAction
    | IFetchAssignedReviewsRequestAction
    | IFetchAssignedReviewsSuccessAction
    | IFetchAssignedReviewsFailureAction
    | ISetActiveTabAction;

export type ThunkResult<R> = ThunkAction<
    R,
    IStoreState,
    undefined,
    QueryReviewAction
>;
