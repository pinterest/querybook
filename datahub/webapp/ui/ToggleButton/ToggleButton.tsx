import React from 'react';

import './ToggleButton.scss';

interface IToggleButton {
    title: string;
    checked: boolean;
    onChange: (checked: boolean) => any;
}

export const ToggleButton: React.FunctionComponent<IToggleButton> = ({
    onChange,
    checked,
    title,
}) => {
    return (
        <div
            className={`ToggleButton ${checked ? 'checked' : ''}`}
            onClick={() => onChange(!checked)}
        >
            <span className="ToggleButton-title">{title}</span>
        </div>
    );
};
