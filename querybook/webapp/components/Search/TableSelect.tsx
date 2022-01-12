import React, { useCallback, useState } from 'react';
import Select from 'react-select';
import AsyncSelect, { Props as AsyncProps } from 'react-select/async';

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
    setTableNames: (tableNames: string[]) => void;
    usePortalMenu?: boolean;

    selectProps?: Partial<AsyncProps<any, false>>;

    // remove the selected table name after select
    clearAfterSelect?: boolean;
}

export const TableSelect: React.FunctionComponent<ITableSelectProps> = ({
    tableNames,
    setTableNames,
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

    const loadOptions = useCallback(
        async (tableName: string) => {
            const { data } = await SearchTableResource.searchConcise({
                metastore_id: metastoreId,
                keywords: tableName,
            });
            const filteredTableNames = data.results.filter(
                (result) =>
                    tableNames.indexOf(`${result.schema}.${result.name}`) === -1
            );
            const tableNameOptions = filteredTableNames.map(
                ({ id, schema, name }) => ({
                    value: id,
                    label: `${schema}.${name}`,
                })
            );
            return tableNameOptions;
        },
        [metastoreId, tableNames]
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
                    const newTableName = option?.label ?? null;
                    if (newTableName == null) {
                        setTableNames([]);
                        return;
                    }
                    const newTableNames = tableNames.concat(newTableName);
                    setTableNames(newTableNames);
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
                {tableNames.map((tableName) => (
                    <HoverIconTag
                        key={tableName}
                        iconOnHover={'x'}
                        onIconHoverClick={() => {
                            const newTableNames = tableNames.filter(
                                (name) => name !== tableName
                            );
                            setTableNames(newTableNames);
                        }}
                    >
                        <span>{tableName}</span>
                    </HoverIconTag>
                ))}
            </div>
        </div>
    );
};
