import clsx from 'clsx';
import React, { useCallback, useImperativeHandle, useState } from 'react';

import { useInterval } from 'hooks/useInterval';

export interface ITimerProps {
    formatter?: (ts: number) => React.ReactChild;
    updater?: (ts: number) => number;

    updateFrequency?: number;
    initialValue?: number;
    className?: string;
}

const defaultFormatter = (timestamp: number) => timestamp;
const defaultUpdater = (timestamp: number) => timestamp + 1;

export interface ITimerHandles {
    updateTimer: (overrideValue: number | null) => void;
}

export const Timer = React.forwardRef<ITimerHandles, ITimerProps>(
    (
        {
            formatter = defaultFormatter,
            updater = defaultUpdater,

            updateFrequency = 1000,
            className = '',
            initialValue = 0,
        },
        ref
    ) => {
        const [value, setValue] = useState(initialValue);

        const updateTimer = useCallback(
            (overrideValue: number | null = null) => {
                setValue((oldValue) =>
                    overrideValue != null ? overrideValue : updater(oldValue)
                );
            },
            [updater]
        );
        useInterval(updateTimer, updateFrequency);

        useImperativeHandle(
            ref,
            () => ({
                updateTimer,
            }),
            [updateTimer]
        );

        const spanClassNames = clsx({
            Timer: true,
            [className]: Boolean(className),
        });
        return <span className={spanClassNames}>{formatter(value)}</span>;
    }
);
