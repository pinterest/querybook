import { useState, useEffect, useRef } from 'react';
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
    const [hasBeenRunning, setHasBeenRunning] = useState(false);
    const hasNotified = useRef(false);

    const isCompleted = queryExecution.status > QueryExecutionStatus.RUNNING;

    useEffect(() => {
        if (queryExecution.status <= QueryExecutionStatus.RUNNING) {
            setHasBeenRunning(true);
        }
    }, [queryExecution.status]);

    useEffect(() => {
        const shouldSendNotification =
            !isWindowFocused() &&
            hasBeenRunning &&
            !hasNotified.current &&
            isCompleted;

        if (shouldSendNotification) {
            const statusText =
                STATUS_TO_TEXT_MAPPING[queryExecution.status] ??
                String(queryExecution.status);
            pushNotification(
                `Query Execution - ${statusText}`,
                getMessageFromStatus(queryExecution.status)
            );
            hasNotified.current = true;
        }
    }, [hasBeenRunning, isCompleted, queryExecution.status]);
}
