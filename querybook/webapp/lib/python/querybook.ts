import { StatementExecutionResultSizes } from 'const/queryResultLimit';
import localStore from 'lib/local-store';

export const querybookModule = {
    /**
     * The maximum size limit for query results, same as the maximum limit from the backend.
     */
    QUERY_RESULT_SIZE_LIMIT: StatementExecutionResultSizes.at(-1),

    /**
     * Fetches the result of a statement execution.
     *
     * Caching behavior:
     * - Results are cached locally using a key based on the statementExecutionId.
     * - If the requested limit is within the cached data, the function returns the cached data.
     * - If the requested limit exceeds the cached data or the cache is empty, the function fetches the data from the server and updates the cache.
     *
     * @param statementExecutionId - The ID of the statement execution to fetch results for.
     * @param limit - The maximum number of rows to fetch. If not provided, fetches all rows up to the QUERY_RESULT_SIZE_LIMIT.
     * @returns A promise that resolves to the query result data.
     * @throws An error if the fetch operation fails or the server returns an error.
     */
    fetchStatementResult: async function (
        statementExecutionId: number,
        limit: number
    ) {
        const cacheKey = `statement_result_${statementExecutionId}`;
        const cache = await localStore.get(cacheKey);
        // First row is the column names
        if (cache && limit + 1 <= cache.length) {
            return cache.slice(0, limit + 1);
        }

        const searchStr = limit ? `?params=%7B%22limit%22%3A${limit}%7D` : '';
        const res = await fetch(
            `/ds/statement_execution/${statementExecutionId}/result/${searchStr}`
        );
        if (res.status === 200) {
            const data = await res.json();
            const newCache = data['data'];
            localStore.set(cacheKey, newCache);
            return newCache;
        } else {
            const data = await res.json();
            throw new Error(data['error']);
        }
    },
};
