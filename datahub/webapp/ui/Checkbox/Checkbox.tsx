import React from 'react';
import classNames from 'classnames';
import './Checkbox.scss';

export interface ICheckboxProps {
    className?: string;
    disabled?: boolean;

    title?: string;
    value?: boolean;
    onChange?: (value: boolean) => any;
}

export const Checkbox: React.FunctionComponent<ICheckboxProps> = ({
    className = '',
    disabled,

    title = '',
    value,
    onChange,
    children,
}) => {
    const checkboxClass = classNames({
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
                />{' '}
                {title}
                {children}
            </label>
        </div>
    );
};
