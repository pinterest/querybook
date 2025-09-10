import { useState, useEffect } from 'react';
import { IQueryExecution, QueryExecutionStatus } from 'const/queryExecution';
import { pushNotification } from 'lib/browser-notification';
import { isWindowFocused } from 'lib/window-focus';
import { STATUS_TO_TEXT_MAPPING } from 'const/queryStatus';

/**
 * Send a browser notification when a query execution is finished while the window is not focused.
 */
export default function useQueryCompleteNotification(
    queryExecution: IQueryExecution
) {
    const [wasRunningState, setWasRunningState] = useState(false);

    useEffect(() => {
        if (queryExecution?.status <= QueryExecutionStatus.RUNNING) {
            setWasRunningState(true);
        }
    }, [queryExecution?.status]);

    useEffect(() => {
        if (
            wasRunningState &&
            queryExecution.status >= QueryExecutionStatus.DONE
        ) {
            // Show notification if the window is focused
            if (!isWindowFocused()) {
                const statusText =
                    STATUS_TO_TEXT_MAPPING[queryExecution.status] ??
                    String(queryExecution.status);
                pushNotification(
                    `Query Execution - ${statusText}`,
                    'Query execution has completed'
                );
            }
            setWasRunningState(false);
            console.log('queryExecution?.status', queryExecution?.status);
        }
    }, [queryExecution.status, wasRunningState]);
}
