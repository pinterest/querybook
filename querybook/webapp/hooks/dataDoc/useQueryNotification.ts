import { useState, useEffect } from 'react';
import { IQueryExecution, QueryExecutionStatus } from 'const/queryExecution';
import { pushNotification } from 'lib/browser-notification';
import { isWindowFocused } from 'lib/window-focus';
import { STATUS_TO_TEXT_MAPPING } from 'const/queryStatus';

const getMessageFromStatus = (status: QueryExecutionStatus) => {
    if (status === QueryExecutionStatus.DONE) {
        return 'Click to view results';
    }
    if (status === QueryExecutionStatus.ERROR) {
        return 'Click to view errors';
    }
    return 'Click to view details';
};

/**
 * Send a browser notification when a query execution is finished while the window is not focused.
 */
export default function useQueryCompleteNotification(
    queryExecution: IQueryExecution
) {
    const [wasRunningState, setWasRunningState] = useState<boolean | null>();

    useEffect(() => {
        if (queryExecution?.status <= QueryExecutionStatus.RUNNING) {
            setWasRunningState(true);
        }

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
                    getMessageFromStatus(queryExecution.status)
                );
            }
            setWasRunningState(false);
        }
    }, [queryExecution.status, wasRunningState]);
}
