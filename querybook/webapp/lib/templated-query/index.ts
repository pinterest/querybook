import { TemplatedQueryResource } from 'resource/queryExecution';

export async function getTemplatedQueryVariables(query: string) {
    // Skip a common request
    if (query === '') {
        return [];
    }
    const { data } = await TemplatedQueryResource.getVariables(query);
    return data;
}

export async function renderTemplatedQuery(
    query: string,
    variables: Record<string, string>,
    engineId: number
) {
    const { data } = await TemplatedQueryResource.renderTemplatedQuery(
        query,
        variables,
        engineId
    );
    return data;
}
