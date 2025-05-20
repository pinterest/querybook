import {
    cleanupExpiredResults,
    getStatementResult,
    QUERY_STATEMENT_RESULT_SIZE_LIMIT,
    setStatementResult,
} from 'lib/local-store/result-store';

export const querybookModule = {
    /**
     * The maximum size limit for query results, same as the maximum limit from the backend.
     */
    QUERY_STATEMENT_RESULT_SIZE_LIMIT,

    /**
     * Fetches the result of a statement execution.
     *
     * Caching behavior:
     * - Results are cached locally using a key based on the statementExecutionId.
     * - If the requested limit is within the cached data, the function returns the cached data.
     * - If the requested limit exceeds the cached data or the cache is empty, the function fetches the data from the server and updates the cache.
     *
     * @param statementExecutionId - The ID of the statement execution to fetch results for.
     * @param limit - The maximum number of rows to fetch. If not provided, fetches all rows up to the QUERY_STATEMENT_RESULT_SIZE_LIMIT.
     * @returns A promise that resolves to the query result data.
     * @throws An error if the fetch operation fails or the server returns an error.
     */
    fetchStatementResult: async (
        statementExecutionId: number,
        limit: number = QUERY_STATEMENT_RESULT_SIZE_LIMIT
    ) => {
        const cacheValue = await getStatementResult(
            statementExecutionId,
            limit
        );
        if (cacheValue) {
            return cacheValue;
        }

        const params = {
            from_env: self.envirionment,
            limit,
        };
        const searchStr =
            '?params=' + encodeURIComponent(JSON.stringify(params));
        const res = await fetch(
            `/ds/statement_execution/${statementExecutionId}/result/${searchStr}`
        );
        if (res.status === 200) {
            const data = await res.json();
            const newCacheData = data['data'];
            setStatementResult(statementExecutionId, newCacheData, limit);

            return newCacheData;
        } else {
            const data = await res.json();
            throw new Error(data['error']);
        }
    },
};

// Cleanup expired statement result cache when the module/querybook is loaded
(async () => {
    await cleanupExpiredResults();
})();
