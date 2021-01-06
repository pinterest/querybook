import ds from 'lib/datasource';

export async function getTemplatedQueryVariables(query: string) {
    // Skip a common request
    if (query === '') {
        return [];
    }
    const { data } = await ds.save('/query_execution/templated_query_params/', {
        query,
    });
    return data as string[];
}

export async function renderTemplatedQuery(
    query: string,
    variables: Record<string, string>
) {
    const { data } = await ds.save<string>(
        '/query_execution/templated_query/',
        {
            query,
            variables,
        },
        false
    );
    return data;
}
