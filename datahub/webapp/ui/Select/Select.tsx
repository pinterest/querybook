import React from 'react';
import classNames from 'classnames';
import './Select.scss';

export interface ISelectProps {
    name?: string;
    disabled?: boolean;
    value: any;
    onChange: (evt: React.ChangeEvent<HTMLSelectElement>) => any;
    className?: string;
    fullWidth?: boolean;
    transparent?: boolean;

    withDeselect?: boolean;
    deselectValue?: string;
}

export const Select: React.FunctionComponent<ISelectProps> = ({
    name,
    disabled,
    value,
    onChange,
    className,
    children,

    fullWidth,
    transparent,

    withDeselect,
    deselectValue,
}) => {
    const deselectOption = withDeselect ? (
        <option value={deselectValue} key="">
            {'Deselect'}
        </option>
    ) : null;

    const selectDOM = (
        <select
            name={name}
            disabled={disabled || false}
            value={value ?? deselectValue}
            onChange={onChange}
        >
            {deselectOption}
            {children}
        </select>
    );

    const wrapperClassName = classNames({
        Select: true,
        'Select-transparent': transparent,
        'Select-full-width': fullWidth,
        [className]: Boolean(className),
    });

    const controlClassName = classNames({
        control: true,
    });

    return (
        <div className={controlClassName}>
            <div className={wrapperClassName}>{selectDOM}</div>
        </div>
    );
};

Select.defaultProps = {
    className: '',
    deselectValue: '',
};

export type IOptions = Array<
    | {
          key: any;
          value: string;
      }
    | string
>;

export function makeSelectOptions(options: IOptions) {
    return options.map(
        // option can be a direct string or an object with key and value property
        (option) =>
            typeof option === 'string' ? (
                <option value={option} key={option}>
                    {option}
                </option>
            ) : (
                <option value={option.key} key={option.key}>
                    {option.value}
                </option>
            )
    );
}
