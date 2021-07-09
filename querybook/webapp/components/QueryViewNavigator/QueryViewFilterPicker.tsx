import React from 'react';
import styled from 'styled-components';
import Select from 'react-select';

import {
    IOptions,
    valueFromId,
    IOption,
    defaultReactSelectStyles,
} from 'lib/utils/react-select';
import { IQueryViewFilter } from 'redux/queryView/types';
import { Title } from 'ui/Title/Title';

const StyledPicker = styled.div`
    padding: 10px;
`;

interface IQueryViewFilterPickerProps {
    filters: IQueryViewFilter;
    updateFilter: (key: string, value: string) => any;
    engineOptions: IOptions<number>;
    statusOptions: IOptions<number>;
}

export const QueryViewFilterPicker: React.FunctionComponent<IQueryViewFilterPickerProps> = ({
    filters,
    updateFilter,
    engineOptions,
    statusOptions,
}) => {
    const enginePickerField = (
        <div className="field mb8">
            <div>
                <Title size={6}>Filter by Engine</Title>
            </div>
            <div className="control">
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
            </div>
        </div>
    );

    const statusPickerField = (
        <div className="field">
            <div>
                <Title size={6}>Filter by Status</Title>
            </div>

            <div className="control">
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
            </div>
        </div>
    );

    return (
        <StyledPicker>
            {/* {userPickerField} */}
            {enginePickerField}
            {statusPickerField}
        </StyledPicker>
    );
};
