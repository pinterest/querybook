import { TemplatedQueryResource } from 'resource/queryExecution';

/**
 * This is a super basic function to check whether or not a string
 * uses jinja templating, it should only be used as a safety measure
 * since it does not provide perfect correctness
 *
 * @param query
 * @returns boolean
 */
export function isQueryUsingTemplating(query: string): boolean {
    return query.includes('{{') || query.includes('{%');
}

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
