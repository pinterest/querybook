import { IQueryReview } from 'const/queryExecution';
import ds from 'lib/datasource';

export const QueryReviewResource = {
    getReviewsCreatedByMe: (limit: number, offset: number) =>
        ds.fetch<IQueryReview[]>('/query_review/created_by_me/', {
            limit,
            offset,
        }),

    getReviewsAssignedToMe: (limit: number, offset: number) =>
        ds.fetch<IQueryReview[]>('/query_review/assigned_to_me/', {
            limit,
            offset,
        }),
};
