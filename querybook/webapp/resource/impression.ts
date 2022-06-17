import { ImpressionType } from 'const/impression';
import ds from 'lib/datasource';

export const ImpressionResource = {
    getUsers: (type: ImpressionType, itemId: number) =>
        ds.fetch<
            Array<{
                latest_view_at: number;
                uid: number;
                views_count: number;
            }>
        >(`/impression/${type}/${itemId}/users/`),
    getTimeSeries: (type: ImpressionType, itemId: number) =>
        ds.fetch<Array<[numUsers: number, date: number]>>(
            `/impression/${type}/${itemId}/timeseries/`
        ),

    getUserCount: (type: ImpressionType, itemId: number) =>
        ds.fetch<number>(`/impression/${type}/${itemId}/count/`),
};
