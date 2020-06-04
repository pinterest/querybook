import React from 'react';
import { useSpring, animated } from 'react-spring';

import './ProgressBar.scss';

interface IProgressBarProps {
    value: number;
    max?: number;
    type?: 'success' | 'info' | 'warning' | 'danger' | 'light' | 'dark';
    isSmall?: boolean;
    showValue?: boolean;
}

export const ProgressBar: React.FunctionComponent<IProgressBarProps> = ({
    value,
    max = 100,
    type = '',
    isSmall = false,
    showValue = false,
}) => {
    const { percent } = useSpring({
        percent: value || 0,
        from: {
            percent: 0,
        },
    });

    return (
        <div
            className={
                isSmall ? 'ProgressBar flex-row small' : 'ProgressBar flex-row'
            }
        >
            <animated.progress
                value={percent}
                max={String(max)}
                className={`${type} mr8`}
            />
            {showValue && (
                <div className="ProgressBar-value">
                    {value == null ? 'Unknown' : `${Math.round(value)}%`}
                </div>
            )}
        </div>
    );
};
