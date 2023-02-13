import React, { useCallback, useState } from 'react';

import { useQueryCells } from 'hooks/dataDoc/useQueryCells';
import { Message } from 'ui/Message/Message';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';

interface IProps {
    defaultNotification: boolean;
    handleNotificationChange: (notification: boolean) => void;
    hasQueryRunning: boolean;
    queryCells: ReturnType<typeof useQueryCells>;
}

export const DataDocRunAllButtonConfirm: React.FunctionComponent<IProps> = ({
    defaultNotification,
    handleNotificationChange,
    hasQueryRunning,
    queryCells,
}) => {
    const [notification, setNotification] = useState(defaultNotification);

    const internalNotificationChange = useCallback(
        (value) => {
            handleNotificationChange(value);
            setNotification(value);
        },
        [handleNotificationChange, setNotification]
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

                <span data-balloon-pos={'up'} className="ml4">
                    Send Notification when Finished
                </span>
            </div>
        </div>
    );
};
