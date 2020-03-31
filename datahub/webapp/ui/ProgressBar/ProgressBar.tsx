import React from 'react';
import { useSpring, animated } from 'react-spring';

interface IProgressBarProps {
    className?: string;
    max?: number;
    value: number;
}

export const ProgressBar: React.FunctionComponent<IProgressBarProps> = ({
    value,
    className = '',
    max = 100,
}) => {
    const { percent } = useSpring({
        percent: value || 0,
        from: {
            percent: 0,
        },
    });

    return (
        <animated.progress
            value={percent}
            max={String(max)}
            className={`progress ${className}`}
        />
    );
};
