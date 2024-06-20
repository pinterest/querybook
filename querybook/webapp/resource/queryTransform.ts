import { IQueryTransformLimited } from 'const/queryTransform';
import ds from 'lib/datasource';

export const QueryTransformResource = {
    getLimitedQuery: (query: string, language: string, row_limit: number) =>
        ds.save<IQueryTransformLimited>(
            '/query/transform/limited/',
            {
                query,
                language,
                row_limit,
            },
            {
                notifyOnError: false,
            }
        ),
    getSampledQuery: (
        query: string,
        language: string,
        sampling_tables: Record<
            string,
            { sampled_table?: string; sample_rate?: number }
        >
    ) =>
        ds.save<string>(
            '/query/transform/sampling/',
            {
                query,
                language,
                sampling_tables,
            },
            {
                notifyOnError: false,
            }
        ),
    getTransformedQuery: (
        query: string,
        language: string,
        row_limit: number,
        sampling_tables: Record<
            string,
            { sampled_table?: string; sample_rate?: number }
        >
    ) =>
        ds.save<IQueryTransformLimited>(
            '/query/transform/',
            {
                query,
                language,
                row_limit,
                sampling_tables,
            },
            {
                notifyOnError: false,
            }
        ),
};
