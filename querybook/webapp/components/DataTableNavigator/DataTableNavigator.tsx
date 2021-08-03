import React, { useCallback, useEffect } from 'react';
import clsx from 'clsx';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';

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

import './DataTableNavigator.scss';

export interface ITableResultWithSelection extends ITableSearchResult {
    selected: boolean;
}

interface IDataTableNavigatorProps {
    onTableRowClick?: (tableId: number, e: React.MouseEvent) => any;
    selectedTableId?: number;
}

const useDataTableNavigatorReduxState = () => {
    const queryMetastores = useSelector(queryMetastoresSelector);
    const dataTableSearchState = useSelector((state: IStoreState) => ({
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
                history.push(`/table/${tableId}/`);
            }
        },
        [onTableRowClick, history]
    );

    const handleSearch = useCallback(
        (searchString: string) => {
            updateSearchString(searchString);
        },
        [updateSearchString]
    );

    const tableRowRenderer = useCallback(
        (table: ITableResultWithSelection) => {
            const tableName = table.full_name;
            const className = clsx({
                selected: table.selected,
            });

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
                                title={tableName}
                            />
                            {showPopover && (
                                <Popover
                                    onHide={() => null}
                                    anchor={anchorElement}
                                    layout={['right', 'top']}
                                >
                                    <DataTableHoverContent
                                        tableId={table.id}
                                        tableName={tableName}
                                    />
                                </Popover>
                            )}
                        </>
                    )}
                </PopoverHoverWrapper>
            );
        },
        [handleTableRowClick]
    );

    const metastorePicker =
        queryMetastores.length > 1 ? (
            <div className="navigator-metastore-picker">
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
            </div>
        ) : null;

    const dataTablesWithSelection: ITableResultWithSelection[] = dataTables.map(
        (table) => ({
            ...table,
            selected: selectedTableId === table.id,
        })
    );

    const tablesDOM = (
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

    return (
        <div className={'DataTableNavigator '}>
            {metastorePicker}
            <DataTableNavigatorSearch
                searchFilters={searchFilters}
                searchString={searchString}
                onSearch={handleSearch}
                updateSearchFilter={updateSearchFilter}
                resetSearchFilter={resetSearchFilter}
            />
            {tablesDOM}
        </div>
    );
};
