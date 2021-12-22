import React, { useState } from 'react';
import Select from 'react-select';
import AsyncSelect, { Props as AsyncProps } from 'react-select/async';
import { debounce } from 'lodash';

import { makeReactSelectStyle } from 'lib/utils/react-select';
import { overlayRoot } from 'ui/Overlay/Overlay';
import { SearchTableResource } from 'resource/search';
import { useSelector } from 'react-redux';
import { queryMetastoresSelector } from 'redux/dataSources/selector';
import { IStoreState } from 'redux/store/types';
import { HoverIconTag } from 'ui/Tag/Tag';

import './TableSelect.scss';

interface ITableSelectProps {
    tableNames: string[];
    onSelect: (tableName: string) => any;
    onRemove: (tableName: string) => any;
    usePortalMenu?: boolean;

    selectProps?: Partial<AsyncProps<any, false>>;

    // remove the selected table name after select
    clearAfterSelect?: boolean;
}

export const TableSelect: React.FunctionComponent<ITableSelectProps> = ({
    tableNames,
    onSelect,
    onRemove,
    usePortalMenu = true,
    selectProps = {},
    clearAfterSelect = false,
}) => {
    const queryMetastoreById = useSelector(
        (state: IStoreState) => state.dataSources.queryMetastoreById
    );
    const queryMetastores = useSelector(queryMetastoresSelector);
    const [metastoreId, setMetastoreId] = useState(queryMetastores[0].id);
    const [searchText, setSearchText] = React.useState('');
    const asyncSelectProps: Partial<AsyncProps<any, false>> = {};
    const tableReactSelectStyle = makeReactSelectStyle(usePortalMenu);
    if (usePortalMenu) {
        asyncSelectProps.menuPortalTarget = overlayRoot;
    }
    if (clearAfterSelect) {
        asyncSelectProps.value = null;
    }

    const loadOptions = debounce(
        (tableName, callback) => {
            SearchTableResource.searchConcise({
                metastore_id: metastoreId,
                keywords: tableName,
            }).then(({ data }) => {
                const filteredTableNames = data.results.filter(
                    (result) =>
                        tableNames.indexOf(
                            `${result.schema}.${result.name}`
                        ) === -1
                );
                const tableNameOptions = filteredTableNames.map(
                    ({ id, schema, name }) => ({
                        value: id,
                        label: `${schema}.${name}`,
                    })
                );
                callback(tableNameOptions);
            });
        },
        1000,
        {
            leading: true,
        }
    );

    return (
        <div className="TableSelect">
            {queryMetastores.length > 1 && (
                <>
                    <div className="TableSelect-label">metastore</div>
                    <Select
                        styles={tableReactSelectStyle}
                        value={{
                            label: queryMetastoreById[metastoreId].name,
                            value: queryMetastoreById[metastoreId].id,
                        }}
                        onChange={({ value }) => setMetastoreId(value)}
                        options={queryMetastores.map((metastore) => ({
                            label: metastore.name,
                            value: metastore.id,
                        }))}
                        className="mb8"
                    />
                    <div className="TableSelect-label">tables</div>
                </>
            )}
            <AsyncSelect
                styles={tableReactSelectStyle}
                placeholder={'search table name...'}
                onChange={(option: any) => {
                    if (option) {
                        onSelect(option.label);
                    } else {
                        onSelect(null);
                    }
                }}
                loadOptions={loadOptions}
                defaultOptions={[]}
                inputValue={searchText}
                onInputChange={(text) => setSearchText(text)}
                noOptionsMessage={() => (searchText ? 'No table found.' : null)}
                {...asyncSelectProps}
                {...selectProps}
            />
            <div className="pv8">
                {tableNames.map((name) => (
                    <HoverIconTag
                        key={name}
                        iconOnHover={'x'}
                        onIconHoverClick={() => onRemove(name)}
                    >
                        <span>{name}</span>
                    </HoverIconTag>
                ))}
            </div>
        </div>
    );
};
