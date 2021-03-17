import React from 'react';
import clsx from 'clsx';
import './TextToggleButton.scss';
import { TooltipDirection } from 'const/tooltip';

export const TextToggleButton: React.FC<{
    value: boolean;
    onChange: (v: boolean) => any;
    text: string;
    tooltip?: string;
    tooltipPos?: TooltipDirection;
}> = ({ value, onChange, text, tooltip, tooltipPos = 'down' }) => {
    const className = clsx({
        TextToggleButton: true,
        active: value,
        ml4: true,
    });
    return (
        <span
            className={className}
            onClick={() => onChange(!value)}
            aria-label={tooltip}
            data-balloon-pos={tooltipPos}
        >
            {text}
        </span>
    );
};
