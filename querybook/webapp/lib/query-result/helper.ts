/**
 * checks if a cell of results table is empty
 * only applies to query results in querybook
 *
 * @param val cell from query execution result
 * @returns boolean
 */
export function isCellValNull(val: any): boolean {
    return val === 'null' || val == null;
}
