import ds from 'lib/datasource';

export const QueryTransformResource = {
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
};
