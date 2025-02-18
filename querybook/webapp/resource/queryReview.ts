import { IQueryReview } from 'const/queryExecution';
import ds from 'lib/datasource';

export enum ReviewType {
    CREATED = 'created',
    ASSIGNED = 'assigned',
}

export const QueryReviewResource = {
    getReviews: (type: ReviewType, limit: number, offset: number) =>
        ds.fetch<IQueryReview[]>(`/query_review/${type}/`, {
            limit,
            offset,
        }),
};
