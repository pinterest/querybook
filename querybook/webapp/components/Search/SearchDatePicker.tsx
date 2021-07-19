import React, { useMemo } from 'react';
import moment from 'moment';
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
}

const defaultInputDateFormat = 'YYYY-MM-DD';

export const SearchDatePicker: React.FC<ISearchDatePickerProps> = ({
    name,
    id,
    value,
    dateFormat = defaultInputDateFormat,
    onChange,
}) => {
    const dateValue = useMemo(
        () => getFormattedDateFromSeconds(value, dateFormat),
        [value, dateFormat]
    );
    return (
        <div className="SearchDatePicker horizontal-space-between">
            <span>{name}</span>
            <input id={id} type="date" value={dateValue} onChange={onChange} />
        </div>
    );
};
