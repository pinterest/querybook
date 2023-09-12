import React, { useCallback, useMemo, useState } from 'react';

import { useQueryCells } from 'hooks/dataDoc/useQueryCells';
import { Message } from 'ui/Message/Message';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';
import { useMakeSelector } from '../../hooks/redux/useMakeSelector';
import { makeLatestQueryExecutionsSelector } from '../../redux/queryExecutions/selector';
import { QueryExecutionStatus } from '../../const/queryExecution';

interface IProps {
    defaultNotification: boolean;
    onNotificationChange: (notification: boolean) => void;
    docId: number;
    index?: number;
}

export const DataDocRunAllButtonConfirm: React.FunctionComponent<IProps> = ({
    defaultNotification,
    onNotificationChange,
    docId,
    index,
}) => {
    const [notification, setNotification] = useState(defaultNotification);

    const internalNotificationChange = useCallback(
        (value: boolean) => {
            onNotificationChange(value);
            setNotification(value);
        },
        [onNotificationChange, setNotification]
    );

    let queryCells = useQueryCells(docId);
    if (index !== undefined) {
        queryCells = queryCells.slice(index);
    }

    const latestQueryExecutions = useMakeSelector(
        makeLatestQueryExecutionsSelector,
        queryCells.map((c) => c.id) ?? []
    );
    const hasQueryRunning = useMemo(
        () => latestQueryExecutions.some((q) => QueryExecutionStatus.DONE),
        [latestQueryExecutions]
    );

    return (
        <div>
            {hasQueryRunning && (
                <Message type="warning" className="mb8">
                    There are some query cells still running. Do you want to run
                    anyway?
                </Message>
            )}
            <div>
                {`You will be executing ${queryCells.length} query cells sequentially. If any of them
            fails, the sequence of execution will be stopped.`}
            </div>
            <br />
            <div className="flex-row">
                <ToggleSwitch
                    checked={notification}
                    onChange={internalNotificationChange}
                />

                <span className="ml4">Send Notification when Finished</span>
            </div>
        </div>
    );
};
