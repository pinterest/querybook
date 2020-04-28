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
        Checkbox: true,
        [className]: Boolean(className),
        checked: value,
    });

    return (
        <div className="Checkbox-wrapper">
            <label className={checkboxClass} disabled={disabled}>
                <input
                    type="checkbox"
                    disabled={disabled}
                    checked={value}
                    onChange={(event) => {
                        if (onChange) {
                            onChange(event.target.checked);
                            event.stopPropagation();
                        }
                    }}
                />{' '}
                {title}
                {children}
            </label>
        </div>
    );
};
