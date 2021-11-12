import React from 'react';
import moment from 'moment';
import { useField } from 'formik';
import styled from 'styled-components';

import { SearchDatePicker } from 'components/Search/SearchDatePicker';

interface IDatePickerFieldProps {
    name: string;
}

const DatePickerWrapper = styled.div`
    display: flex;
    align-items: center;
    width: 50%;
`;

const StyledDatePicker = styled(SearchDatePicker)`
    margin-bottom: 0px;
`;

function utcSecondsToLocal(dateInSeconds?: number): number {
    if (dateInSeconds) {
        const utcOffset = moment().utcOffset();
        return Number(moment(dateInSeconds - utcOffset * 60, 'X').format('X'));
    }

    return undefined;
}

export const DatePickerField: React.FC<IDatePickerFieldProps> = ({ name }) => {
    const [field, , helper] = useField({ name });

    return (
        <DatePickerWrapper>
            <StyledDatePicker
                value={utcSecondsToLocal(field.value)}
                onChange={(evt) => {
                    helper.setValue(
                        Number(moment(evt.target.value).format('X'))
                    );
                }}
            />
        </DatePickerWrapper>
    );
};
