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
