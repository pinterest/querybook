import React, { useMemo, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import { useSelector } from 'react-redux';
import { IStoreState } from 'redux/store/types';
import {
    makeReactSelectStyle,
    asyncReactSelectStyles,
    IOptions,
} from 'lib/utils/react-select';
import { SearchSchemaResource } from 'resource/search';

interface ISearchSchemaSelectProps {
    schema?: string[];
    updateSearchFilter: (key: string, value: string[]) => void;
}

const tableReactSelectStyle = makeReactSelectStyle(
    true,
    asyncReactSelectStyles
);

export const SearchSchemaSelect: React.FC<ISearchSchemaSelectProps> = ({
    updateSearchFilter,
    schema,
}) => {
    const currentMetastoreId = useSelector(
        (state: IStoreState) => state.environment.currentEnvironmentId
    );

    const handleUpdateSearchFilter = useCallback((option: IOptions<string>) => {
        updateSearchFilter(
            'schema',
            option.map((o) => o.value)
        );
    }, []);

    const loadOptions = useCallback(async (value) => {
        const searchRequest = await SearchSchemaResource.getMore({
            metastore_id: currentMetastoreId,
            name: value,
        });

        return searchRequest.data.results.map((schema) => ({
            label: schema.name,
            value: schema.name,
        }));
    }, []);

    const selectedSchemaItems = useMemo(
        () =>
            (schema || []).map((s) => ({
                value: s,
                label: s,
            })),
        [schema]
    );
    return (
        <AsyncSelect
            styles={tableReactSelectStyle}
            placeholder={'search schema name'}
            value={selectedSchemaItems}
            onChange={handleUpdateSearchFilter}
            loadOptions={loadOptions}
            defaultOptions={[]}
            noOptionsMessage={() => 'No schema found.'}
            isMulti
        />
    );
};
