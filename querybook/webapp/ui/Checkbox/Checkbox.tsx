import React from 'react';
import clsx from 'clsx';
import './Checkbox.scss';
import { AccentText } from 'ui/StyledText/StyledText';

export interface ICheckboxProps {
    className?: string;
    disabled?: boolean;

    title?: string;
    value?: boolean;
    onChange?: (value: boolean) => any;
    small?: boolean;
}

export const Checkbox: React.FunctionComponent<ICheckboxProps> = ({
    className = '',
    disabled,

    title = '',
    value,
    onChange,
    children,
    small,
}) => {
    const checkboxClass = clsx({
        [className]: Boolean(className),
        checked: value,
    });

    return (
        <div className="Checkbox">
            <label
                className={checkboxClass}
                onClick={
                    disabled
                        ? null
                        : (event) => {
                              if (onChange) {
                                  onChange(!value);
                                  event.stopPropagation();
                                  event.preventDefault();
                              }
                          }
                }
            >
                <input
                    type="checkbox"
                    disabled={disabled}
                    checked={value}
                    readOnly
                />
                <AccentText size={small ? 'xsmall' : 'small'}>
                    {title}
                    {children}
                </AccentText>
            </label>
        </div>
    );
};
