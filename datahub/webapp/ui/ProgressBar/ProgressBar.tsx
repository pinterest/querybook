import React from 'react';
import classNames from 'classnames';

import './ProgressBar.scss';

export const ProgressBarTypes = [
    'success',
    'info',
    'warning',
    'danger',
    'light',
    'dark',
] as const;
export interface IProgressBarProps {
    value: number;
    max?: number;
    type?: typeof ProgressBarTypes[number];
    isSmall?: boolean;
    showValue?: boolean;
}

export const ProgressBar: React.FunctionComponent<IProgressBarProps> = ({
    value,
    max = 100,
    type,
    isSmall = false,
    showValue = false,
}) => (
    <div
        className={classNames({
            ProgressBar: true,
            'flex-row': true,
            small: isSmall,
        })}
    >
        <progress
            // quick hack before removing react-spring
            value={value}
            max={String(max)}
            className={type ? `${type} mr8` : 'mr8'}
        />
        {showValue && (
            <div className="ProgressBar-value">
                {value == null ? 'Unknown' : `${Math.floor(value)}%`}
            </div>
        )}
    </div>
);
