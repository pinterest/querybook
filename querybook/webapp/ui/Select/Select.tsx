import clsx from 'clsx';
import React from 'react';

import { AccentText } from 'ui/StyledText/StyledText';

import './Select.scss';

export const DESELECT_VALUE = '';
export interface ISelectProps {
    name?: string;
    disabled?: boolean;
    value: any;
    onChange: (evt: React.ChangeEvent<HTMLSelectElement>) => any;
    className?: string;
    fullWidth?: boolean;
    transparent?: boolean;

    withDeselect?: boolean;
}

export const Select: React.FunctionComponent<ISelectProps> = ({
    name,
    disabled,
    value,
    onChange,
    className = '',
    children,

    fullWidth,
    transparent,

    withDeselect,
}) => {
    const deselectOption = withDeselect ? (
        <option value={DESELECT_VALUE} key="">
            {'Choose one'}
        </option>
    ) : null;

    const selectDOM = (
        <select
            name={name}
            disabled={disabled || false}
            value={value ?? DESELECT_VALUE}
            onChange={onChange}
        >
            {deselectOption}
            {children}
        </select>
    );

    const wrapperClassName = clsx({
        Select: true,
        'Select-transparent': transparent,
        'Select-full-width': fullWidth,
        [className]: Boolean(className),
    });

    const controlClassName = clsx({
        control: true,
    });

    return (
        <div className={controlClassName}>
            <div className={wrapperClassName}>
                <AccentText>{selectDOM}</AccentText>
            </div>
        </div>
    );
};

export type IOptions = Array<
    | {
          key: any;
          value: string;
          hidden?: boolean;
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
                <option
                    value={option.key}
                    key={option.key}
                    hidden={option.hidden}
                >
                    {option.value}
                </option>
            )
    );
}
