import type { ICancelablePromise } from 'lib/datasource';

export interface IResource<T> {
    (): ICancelablePromise<{ data: T }>;
}
export type PaginatedResource = <T>(
    limit: number,
    offset: number
) => ICancelablePromise<T>;
