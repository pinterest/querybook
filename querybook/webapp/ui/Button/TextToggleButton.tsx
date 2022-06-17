import clsx from 'clsx';
import React from 'react';

import { TooltipDirection } from 'const/tooltip';

import './TextToggleButton.scss';

export const TextToggleButton: React.FC<{
    value: boolean;
    onChange: (v: boolean) => any;
    text: string;
    tooltip?: string;
    tooltipPos?: TooltipDirection;
    className?: string;
}> = ({ value, onChange, text, tooltip, tooltipPos = 'down', className }) => {
    const combinedClassName = clsx({
        TextToggleButton: true,
        active: value,
        ml4: true,
        [className]: true,
    });
    return (
        <span
            className={combinedClassName}
            onClick={() => onChange(!value)}
            aria-label={tooltip}
            data-balloon-pos={tooltipPos}
        >
            {text}
        </span>
    );
};
