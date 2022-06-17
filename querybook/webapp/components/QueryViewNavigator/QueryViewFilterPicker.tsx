import React from 'react';
import Select from 'react-select';
import styled from 'styled-components';

import {
    defaultReactSelectStyles,
    IOption,
    IOptions,
    valueFromId,
} from 'lib/utils/react-select';
import { IQueryViewFilter } from 'redux/queryView/types';
import { FormField } from 'ui/Form/FormField';

const StyledPicker = styled.div`
    .FormField:first-child {
        margin-top: 0px;
    }
`;

interface IQueryViewFilterPickerProps {
    filters: IQueryViewFilter;
    updateFilter: (key: string, value: string) => any;
    engineOptions: IOptions<number>;
    statusOptions: IOptions<number>;
}

export const QueryViewFilterPicker: React.FunctionComponent<
    IQueryViewFilterPickerProps
> = ({ filters, updateFilter, engineOptions, statusOptions }) => {
    const enginePickerField = (
        <FormField label="Engine" stacked>
            <Select
                styles={defaultReactSelectStyles}
                value={valueFromId(engineOptions, filters.engine)}
                onChange={(value: IOption) => {
                    const val = value ? value.value : null;
                    updateFilter('engine', val);
                }}
                options={engineOptions}
                isClearable={true}
            />
        </FormField>
    );

    const statusPickerField = (
        <FormField label="Status" stacked>
            <Select
                styles={defaultReactSelectStyles}
                value={valueFromId(statusOptions, filters.status)}
                onChange={(value: IOption) => {
                    const val = value ? value.value : null;
                    updateFilter('status', val);
                }}
                options={statusOptions}
                isClearable={true}
            />
        </FormField>
    );

    return (
        <StyledPicker>
            {enginePickerField}
            {statusPickerField}
        </StyledPicker>
    );
};
