import React from 'react';

import { Button, IButtonProps } from 'ui/Button/Button';

import './ToggleButton.scss';

export interface IToggleButtonProps extends IButtonProps {
    title: string;
    checked: boolean;
    onClick: (...args: any) => any;
}

export const ToggleButton: React.FunctionComponent<IToggleButtonProps> = ({
    onClick,
    checked,
    title,
    ...otherProps
}) => (
    <div
        className={`ToggleButton ${checked ? 'checked' : ''}`}
        onClick={() => onClick(!checked)}
    >
        <Button {...otherProps}>{title}</Button>
    </div>
);
