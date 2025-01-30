import { IQueryReview } from 'const/queryExecution';
import ds from 'lib/datasource';

export const QueryReviewResource = {
    getReviewsCreatedByMe: () =>
        ds.fetch<IQueryReview[]>('/query_review/created_by_me/'),

    getReviewsAssignedToMe: () =>
        ds.fetch<IQueryReview[]>('/query_review/assigned_to_me/'),
};
