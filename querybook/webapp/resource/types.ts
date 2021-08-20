import type { ICancelablePromise } from 'lib/datasource';

export interface IResource<T> {
    (): ICancelablePromise<{ data: T }>;
}
export interface IPaginatedResource<T> {
    (limit: number, offset: number): ICancelablePromise<{ data: T[] }>;
}
