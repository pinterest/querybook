import React from 'react';
import Select from 'react-select';

import { IQueryEngine } from 'const/queryEngine';
import { defaultReactSelectStyles } from 'lib/utils/react-select';
import { FormField } from 'ui/Form/FormField';

interface IProps {
    filters: any;
    updateFilter: any;
    queryEngines: IQueryEngine[];
}

export const QuerySnippetFilterPicker: React.FunctionComponent<IProps> = ({
    filters,
    updateFilter,
    queryEngines,
}) => {
    const enginePickerField = (
        <FormField label="Engine" stacked>
            <Select
                styles={defaultReactSelectStyles}
                value={filters.engine_id}
                onChange={(value) => updateFilter('engine', value)}
                options={queryEngines.map((engine) => ({
                    label: engine.name,
                    value: engine.id,
                }))}
                isClearable={true}
            />
        </FormField>
    );

    return <div className="QuerySnippetFilterPicker">{enginePickerField}</div>;
};
