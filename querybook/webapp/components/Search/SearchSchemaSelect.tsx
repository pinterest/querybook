import React, { useMemo, useCallback, useState } from 'react';
import AsyncSelect from 'react-select/async';
import {
    makeReactSelectStyle,
    asyncReactSelectStyles,
    IOptions,
} from 'lib/utils/react-select';
import { SearchSchemaResource } from 'resource/search';

interface ISearchSchemaSelectProps {
    metastoreId: number;
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
    metastoreId,
}) => {
    const [searchText, setSearchText] = useState('');

    const handleUpdateSearchFilter = useCallback((option: IOptions<string>) => {
        updateSearchFilter(
            'schema',
            option.map((o) => o.value)
        );
    }, []);

    const loadOptions = useCallback(
        async (value) => {
            const searchRequest = await SearchSchemaResource.getMore({
                metastore_id: metastoreId,
                name: value,
            });

            return searchRequest.data.results.map((schema) => ({
                label: schema.name,
                value: schema.name,
            }));
        },
        [metastoreId, schema]
    );

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
            onChange={handleUpdateSearchFilter}
            loadOptions={loadOptions}
            defaultOptions={[]}
            inputValue={searchText}
            onInputChange={(text) => setSearchText(text)}
            noOptionsMessage={() => (searchText ? 'No schema found.' : null)}
            isMulti
        />
    );
};
