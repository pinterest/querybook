import React from 'react';
import moment from 'moment';
import { useField } from 'formik';
import styled from 'styled-components';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DatePickerWrapper = styled.div`
    display: flex;
    align-items: center;
    width: 50%;
`;

const StyledDatePicker = styled(DatePicker)`
    max-width: 100px;
`;

const StyledLabel = styled.label`
 white-space: nowrap;
 padding-right: 12px;
`;

function formatDate(dateInSeconds?: number): Date {
    if (!dateInSeconds) {
        return new Date();
    }

    return moment(dateInSeconds, 'X').local().toDate();
}

export const DatePickerField = ({
    name,
    label,
}: {
    name: string;
    label: string;
}) => {
    const [field, , helper] = useField({ name });

    return (
        <DatePickerWrapper>
            <StyledLabel>{label}</StyledLabel>
            <StyledDatePicker
                dateFormat="yyyy/MM/dd"
                selected={formatDate(field.value)}
                onChange={(date) => helper.setValue(date)}
                minDate={new Date()}
            />
        </DatePickerWrapper>
    );
};
