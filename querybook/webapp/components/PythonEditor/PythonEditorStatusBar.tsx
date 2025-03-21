import React, { useEffect, useRef, useState } from 'react';

import { PythonExecutionStatus } from 'lib/python/types';
import { Icon } from 'ui/Icon/Icon';

import './PythonEditorStatusBar.scss';

interface PythonEditorStatusBarProps {
    executionStatus: PythonExecutionStatus;
    executionCount?: number | string;
}

export const PythonEditorStatusBar: React.FC<PythonEditorStatusBarProps> = ({
    executionStatus,
    executionCount,
}) => {
    const intervalRef = useRef<number | null>(null);
    const [elapsed, setElapsed] = useState<number>(0);

    useEffect(() => {
        // Clear any previous timer
        if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
        }

        if (executionStatus === PythonExecutionStatus.RUNNING) {
            // Reset elapsed time
            setElapsed(0);
            // Start the timer – update elapsed every 100ms
            intervalRef.current = window.setInterval(() => {
                setElapsed((prevElapsed) => prevElapsed + 0.1);
            }, 100);
        }

        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
        };
    }, [executionStatus]);

    return (
        <div className="PythonEditorStatusBar">
            {executionStatus === PythonExecutionStatus.RUNNING && (
                <Icon name="Loading" className="mr4" size={16} />
            )}
            <div>{executionStatus}</div>
            <div>{elapsed.toFixed(1)}s</div>
            <div className="execution-count">
                [
                {executionStatus === PythonExecutionStatus.RUNNING
                    ? '∗'
                    : executionCount ?? ' '}
                ]
            </div>
        </div>
    );
};
