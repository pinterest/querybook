import React, { useCallback, useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import * as dataTableSearchActions from 'redux/dataTableSearch/action';
import { IStoreState, Dispatch } from 'redux/store/types';
import {
    ITableSearchResult,
    ITableSearchFilters,
} from 'redux/dataTableSearch/types';
import { queryMetastoresSelector } from 'redux/dataSources/selector';

import { InfinityScroll } from 'ui/InfinityScroll/InfinityScroll';
import { Select, makeSelectOptions } from 'ui/Select/Select';
import { ListLink } from 'ui/Link/ListLink';
import { PopoverHoverWrapper } from 'ui/Popover/PopoverHoverWrapper';
import { Popover } from 'ui/Popover/Popover';

import { DataTableHoverContent } from './DataTableHoverContent';
import { DataTableNavigatorSearch } from './DataTableNavigatorSearch';

import { SchemaTableView } from './SchemaTableView/SchemaTableView';

import './DataTableNavigator.scss';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { UrlContextMenu } from 'ui/ContextMenu/UrlContextMenu';
import { TableUploaderButton } from 'components/TableUploader/TableUploaderButton';

const PRESELECTED_FILTERS = ['golden'];

function isFilteringTables(
    searchString: string,
    searchFilters: ITableSearchFilters
): boolean {
    return (
        !!searchString ||
        Object.keys(searchFilters)
            .filter((key) => !PRESELECTED_FILTERS.includes(key))
            .some((key) => searchFilters[key])
    );
}

export interface ITableResultWithSelection extends ITableSearchResult {
    full_name: string;
    selected: boolean;
}

interface IDataTableNavigatorProps {
    onTableRowClick?: (tableId: number, e: React.MouseEvent) => any;
    selectedTableId?: number;
}

const useDataTableNavigatorReduxState = () => {
    const queryMetastores = useSelector(queryMetastoresSelector);
    const dataTableSearchState = useShallowSelector((state: IStoreState) => ({
        dataTables: state.dataTableSearch.results,
        numDataTables: state.dataTableSearch.count,
        searchString: state.dataTableSearch.searchString,
        searchFilters: state.dataTableSearch.searchFilters,
        metastoreId: state.dataTableSearch.metastoreId,
        isSearching: !!state.dataTableSearch.searchRequest,
    }));
    return {
        ...dataTableSearchState,
        queryMetastores,
    };
};

const useDataTableNavigatorReduxDispatch = () => {
    const dispatch: Dispatch = useDispatch();

    return {
        resetSearchFilter: useCallback(
            () => dispatch(dataTableSearchActions.resetSearchFilter()),
            []
        ),
        updateSearchString: useCallback(
            (searchString: string) =>
                dispatch(
                    dataTableSearchActions.updateSearchString(searchString)
                ),
            []
        ),
        updateSearchFilter: useCallback(
            <K extends keyof ITableSearchFilters>(
                filterKey: K,
                filterVal: ITableSearchFilters[K]
            ) =>
                dispatch(
                    dataTableSearchActions.updateSearchFilter(
                        filterKey,
                        filterVal
                    )
                ),
            []
        ),
        selectMetastore: useCallback(
            (metastoreId: number) =>
                dispatch(dataTableSearchActions.selectMetastore(metastoreId)),
            []
        ),
        getMoreDataTable: useCallback(
            () => dispatch(dataTableSearchActions.getMoreDataTable()),
            []
        ),
        resetSearch: useCallback(
            () => dispatch(dataTableSearchActions.resetSearch()),
            []
        ),
    };
};

export const DataTableNavigator: React.FC<IDataTableNavigatorProps> = ({
    onTableRowClick,
    selectedTableId,
}) => {
    const history = useHistory();
    const environmentName = useSelector(currentEnvironmentSelector).name;
    const {
        queryMetastores,
        dataTables,
        numDataTables,
        searchString,
        searchFilters,
        metastoreId,
        isSearching,
    } = useDataTableNavigatorReduxState();
    const {
        resetSearchFilter,
        updateSearchString,
        updateSearchFilter,
        selectMetastore,
        getMoreDataTable,
        resetSearch,
    } = useDataTableNavigatorReduxDispatch();

    const noMetastore = queryMetastores.length === 0;
    useEffect(() => {
        if (noMetastore) {
            resetSearch();
        }
    }, [noMetastore]);

    useEffect(() => {
        if (
            queryMetastores.length > 0 &&
            !queryMetastores.find((metastore) => metastore.id === metastoreId)
        ) {
            selectMetastore(queryMetastores[0].id);
        }
    }, [queryMetastores, metastoreId]);

    const handleMetastoreChange = useCallback(
        (evt: React.ChangeEvent<HTMLSelectElement>) => {
            selectMetastore(Number(evt.target.value));
        },
        [selectMetastore]
    );

    const handleTableRowClick = useCallback(
        (tableId: number, event: React.MouseEvent) => {
            if (onTableRowClick) {
                onTableRowClick(tableId, event);
            } else {
                // default behavior
                history.push(`/${environmentName}/table/${tableId}/`);
            }
        },
        [onTableRowClick, history, environmentName]
    );

    const handleSearch = useCallback(
        (searchString: string) => {
            updateSearchString(searchString);
        },
        [updateSearchString]
    );

    const tableRowRenderer = useCallback(
        (table: ITableResultWithSelection) => {
            const className = clsx({
                selected: table.selected,
            });
            const tableUrl = `/${environmentName}/table/${table.id}/`;

            return (
                <PopoverHoverWrapper>
                    {(showPopover, anchorElement) => (
                        <>
                            <ListLink
                                className={className}
                                onClick={(event) =>
                                    handleTableRowClick(table.id, event)
                                }
                                isRow
                                title={table.full_name}
                            />
                            <UrlContextMenu
                                url={tableUrl}
                                anchorRef={{ current: anchorElement }}
                            />

                            {showPopover && (
                                <Popover
                                    onHide={() => null}
                                    anchor={anchorElement}
                                    layout={['right', 'top']}
                                >
                                    <DataTableHoverContent
                                        tableId={table.id}
                                        tableName={table.full_name}
                                    />
                                </Popover>
                            )}
                        </>
                    )}
                </PopoverHoverWrapper>
            );
        },
        [handleTableRowClick, environmentName]
    );

    const showTableSearchResult = useMemo(
        () => isFilteringTables(searchString, searchFilters),
        [searchString, searchFilters]
    );

    const metastorePicker = (
        <div className="navigator-metastore-picker horizontal-space-between pt12 pr8 pl4">
            <Select
                className="small"
                value={metastoreId}
                onChange={handleMetastoreChange}
                transparent
            >
                {makeSelectOptions(
                    queryMetastores.map((metastore) => ({
                        value: metastore.name,
                        key: metastore.id,
                    }))
                )}
            </Select>

            <TableUploaderButton
                size={'18px'}
                noPadding
                tooltipPos="left"
                className="ml4"
                metastoreId={metastoreId}
            />
        </div>
    );

    const dataTablesWithSelection: ITableResultWithSelection[] = dataTables.map(
        (table) => ({
            ...table,
            full_name: `${table.schema}.${table.name}`,
            selected: selectedTableId === table.id,
        })
    );

    let tablesDOM = null;

    if (!showTableSearchResult) {
        tablesDOM = (
            <SchemaTableView
                tableRowRenderer={tableRowRenderer}
                selectedTableId={selectedTableId}
            />
        );
    } else {
        tablesDOM = (
            <div className="table-scroll-wrapper">
                <InfinityScroll<ITableSearchResult>
                    elements={dataTablesWithSelection}
                    onLoadMore={getMoreDataTable}
                    hasMore={numDataTables > dataTables.length || isSearching}
                    itemRenderer={tableRowRenderer}
                    itemHeight={28}
                />
            </div>
        );
    }

    return (
        <div className="DataTableNavigator SidebarNavigator">
            <div className="list-header">
                {metastorePicker}
                <DataTableNavigatorSearch
                    metastoreId={metastoreId}
                    searchFilters={searchFilters}
                    searchString={searchString}
                    onSearch={handleSearch}
                    updateSearchFilter={updateSearchFilter}
                    resetSearchFilter={resetSearchFilter}
                    showTableSearchResult={showTableSearchResult}
                />
            </div>
            <div className="list-content">{tablesDOM}</div>
        </div>
    );
};
