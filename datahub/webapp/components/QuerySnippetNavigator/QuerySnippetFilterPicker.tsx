import React from 'react';
import Select from 'react-select';

import { defaultReactSelectStyles } from 'lib/utils/react-select';
import { IQueryEngine } from 'const/queryEngine';
import { Title } from 'ui/Title/Title';

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
        <div>
            <Title size={6}>Filter by Engine</Title>
            <div>
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
            </div>
        </div>
    );

    return <div className="QuerySnippetFilterPicker">{enginePickerField}</div>;
};
