import clsx from 'clsx';
import moment from 'moment';
import React, { useMemo } from 'react';

import './SearchDatePicker.scss';

const getFormattedDateFromSeconds = (
    seconds: string | number | null | undefined,
    format: string
) =>
    seconds != null
        ? moment(parseInt(seconds as string, 10) * 1000).format(format)
        : '';

interface ISearchDatePickerProps {
    name: string;
    id: string;

    /**
     * Date in seconds from epoch
     */
    value: number | string | null | undefined;
    dateFormat?: string;

    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    className?: string;
}

const defaultInputDateFormat = 'YYYY-MM-DD';

export const SearchDatePicker: React.FC<ISearchDatePickerProps> = ({
    name,
    id,
    value,
    dateFormat = defaultInputDateFormat,
    onChange,
    className,
}) => {
    const dateValue = useMemo(
        () => getFormattedDateFromSeconds(value, dateFormat),
        [value, dateFormat]
    );
    return (
        <div
            className={clsx(
                'SearchDatePicker',
                'horizontal-space-between',
                className
            )}
        >
            <span>{name}</span>
            <input id={id} type="date" value={dateValue} onChange={onChange} />
        </div>
    );
};
