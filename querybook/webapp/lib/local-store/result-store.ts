import localForage from 'localforage';

import { IStatementResult } from 'const/queryExecution';
import { StatementExecutionResultSizes } from 'const/queryResultLimit';

interface StatementResultValue {
    limit: number; // limit might be greater than the actual data length, it is the limit used to fetch from the server
    data: IStatementResult['data'];
    expireAt: number; // only used for cleanup
}

const STATEMENT_RESULT_TTL_IN_MS = 90 * 24 * 60 * 60 * 1000; // keep the cache for 3 months to prevent overloading the browser storage

export const QUERY_STATEMENT_RESULT_SIZE_LIMIT =
    StatementExecutionResultSizes.at(-1);

// Create a localForage instance for your query statement results.
const statementResultStore = localForage.createInstance({
    driver: localForage.INDEXEDDB,
    name: 'Querybook',
    version: 1.0,
    storeName: 'querybook_statement_result',
    description: 'Store query statement execution result here.',
});

/**
 * Sets a statement result in localForage with an expiry timestamp.
 *
 * @param statementExecutionId - Unique identifier for the statement execution.
 * @param value - The statement result data to be stored.
 * @param limit - The limit used to fetch the data from the server.
 */
export const setStatementResult = async (
    statementExecutionId: number,
    value: IStatementResult['data'],
    limit: number
) => {
    const valueWithTTL: StatementResultValue = {
        limit,
        data: value,
        expireAt: Date.now() + STATEMENT_RESULT_TTL_IN_MS,
    };

    try {
        return await statementResultStore.setItem(
            `${statementExecutionId}`,
            valueWithTTL
        );
    } catch (error) {
        console.error(
            `Error setting result for statementExecutionId ${statementExecutionId}:`,
            error
        );
        throw error;
    }
};

/**
 * Retrieves the statement result from localForage.
 *
 * @param statementExecutionId - Unique identifier for the statement execution.
 * @param limit - Limit to fetch the result data.
 * @returns The sliced data based on the limit if present, otherwise the entire data, or null.
 */
export const getStatementResult = async (
    statementExecutionId: number,
    limit: number
): Promise<IStatementResult['data'] | null> => {
    try {
        const value = await statementResultStore.getItem<StatementResultValue>(
            `${statementExecutionId}`
        );
        if (value && limit <= value.limit) {
            // First row is the column names
            return value.data.slice(0, limit + 1);
        }

        return null;
    } catch (error) {
        console.error(
            `Error getting result for statementExecutionId ${statementExecutionId}:`,
            error
        );
    }
};

/**
 * Iterates over stored items and cleans up expired records.
 */
export const cleanupExpiredResults = async (): Promise<void> => {
    try {
        const keys = await statementResultStore.keys();
        // Process cleanups concurrently for all keys.
        await Promise.all(
            keys.map(async (key) => {
                try {
                    const value =
                        await statementResultStore.getItem<StatementResultValue>(
                            key
                        );
                    if (value && Date.now() > value.expireAt) {
                        await statementResultStore.removeItem(key);
                    }
                } catch (error) {
                    console.error(`Error cleaning up key ${key}:`, error);
                }
            })
        );
    } catch (err) {
        console.error('Error during statement result cleanup:', err);
    }
};
