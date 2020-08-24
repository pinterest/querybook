import React from 'react';

import { Button, IButtonProps } from 'ui/Button/Button';

import './ToggleButton.scss';

interface IToggleButton extends IButtonProps {
    title: string;
    checked: boolean;
    onClick: (...args: any) => any;
}

export const ToggleButton: React.FunctionComponent<IToggleButton> = ({
    onClick,
    checked,
    title,
    ...otherProps
}) => {
    return (
        <div
            className={`ToggleButton ${checked ? 'checked' : ''}`}
            onClick={() => onClick(!checked)}
        >
            <Button {...otherProps}>{title}</Button>
        </div>
    );
};
