import React from 'react';

import './ToggleSwitch.scss';

export interface IToggleSwitchProps {
    onChange: (checked: boolean) => any;
    checked: boolean;
}

export const ToggleSwitch: React.FunctionComponent<IToggleSwitchProps> = ({
    onChange,
    checked,
}) => (
    <div
        className={`ToggleSwitch ${checked ? 'checked' : ''}`}
        onClick={() => onChange(!checked)}
    >
        <span className="ToggleSwitch-circle" />
    </div>
);
