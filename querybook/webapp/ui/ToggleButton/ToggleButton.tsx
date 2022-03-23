import clsx from 'clsx';
import React from 'react';

import { Button, ButtonProps } from 'ui/Button/Button';

import './ToggleButton.scss';

export interface IToggleButtonProps extends ButtonProps {
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
    <Button
        {...otherProps}
        onClick={() => onClick(!checked)}
        className={clsx('ToggleButton', checked && 'checked')}
        title={title}
    />
);
