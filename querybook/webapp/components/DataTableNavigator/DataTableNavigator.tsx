import clsx from 'clsx';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import { TableUploaderButton } from 'components/TableUploader/TableUploaderButton';
import {
    tableNameDataTransferName,
    tableNameDraggableType,
} from 'const/metastore';
import { SurveySurfaceType } from 'const/survey';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { useSurveyTrigger } from 'hooks/ui/useSurveyTrigger';
import { queryMetastoresSelector } from 'redux/dataSources/selector';
import * as dataTableSearchActions from 'redux/dataTableSearch/action';
import {
    ITableSearchFilters,
    ITableSearchResult,
} from 'redux/dataTableSearch/types';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { UrlContextMenu } from 'ui/ContextMenu/UrlContextMenu';
import { InfinityScroll } from 'ui/InfinityScroll/InfinityScroll';
import { ListLink } from 'ui/Link/ListLink';
import { Popover } from 'ui/Popover/Popover';
import { PopoverHoverWrapper } from 'ui/Popover/PopoverHoverWrapper';
import { makeSelectOptions, Select } from 'ui/Select/Select';

import { DataTableHoverContent } from './DataTableHoverContent';
import { DataTableNavigatorSearch } from './DataTableNavigatorSearch';
import { SchemaTableView } from './SchemaTableView/SchemaTableView';

import './DataTableNavigator.scss';

function isFilteringTables(
    searchString: string,
    searchFilters: ITableSearchFilters
): boolean {
    return (
        !!searchString ||
        Object.keys(searchFilters).some((key) => searchFilters[key])
    );
}

export interface ITableResultWithSelection extends ITableSearchResult {
    displayName: string;
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noMetastore]);

    const queryMetastore = useMemo(
        () =>
            queryMetastores?.find((metastore) => metastore.id === metastoreId),
        [metastoreId, queryMetastores]
    );
    useEffect(() => {
        if (queryMetastores.length > 0 && !queryMetastore) {
            selectMetastore(queryMetastores[0].id);
        }
    }, [queryMetastores, queryMetastore, selectMetastore]);

    const handleMetastoreChange = useCallback(
        (evt: React.ChangeEvent<HTMLSelectElement>) => {
            selectMetastore(Number(evt.target.value));
        },
        [selectMetastore]
    );

    const handleTableRowClick = useCallback(
        (tableId: number, event: React.MouseEvent) => {
            // Either middle click on cmd/ctrl is pressed
            const isNewTabClick = event.metaKey || event.button === 1;
            if (onTableRowClick && !isNewTabClick) {
                onTableRowClick(tableId, event);
            } else {
                const url = `/${environmentName}/table/${tableId}/`;
                if (isNewTabClick) {
                    window.open(url);
                } else {
                    history.push(`/${environmentName}/table/${tableId}/`);
                }
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

    const triggerSurvey = useSurveyTrigger();
    useEffect(() => {
        if (searchString === '') {
            return;
        }

        triggerSurvey(SurveySurfaceType.TABLE_SEARCH, {
            search_query: searchString,
            search_filter: Object.keys(searchFilters),
            is_modal: false,
        });
    }, [searchString, searchFilters, triggerSurvey]);

    const tableRowRenderer = useCallback(
        (table: ITableResultWithSelection) => (
            <TableRow
                table={table}
                handleTableRowClick={handleTableRowClick}
                environmentName={environmentName}
            />
        ),
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
            displayName: `${table.schema}.${table.name}`,
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
                {queryMetastore && (
                    <DataTableNavigatorSearch
                        queryMetastore={queryMetastore}
                        searchFilters={searchFilters}
                        searchString={searchString}
                        onSearch={handleSearch}
                        updateSearchFilter={updateSearchFilter}
                        resetSearchFilter={resetSearchFilter}
                        showTableSearchResult={showTableSearchResult}
                    />
                )}
            </div>
            <div className="list-content">{tablesDOM}</div>
        </div>
    );
};

const TableRow: React.FC<{
    table: ITableResultWithSelection;
    handleTableRowClick: (tableId: number, event: React.MouseEvent) => void;
    environmentName: string;
}> = ({ table, handleTableRowClick, environmentName }) => {
    const className = clsx({
        selected: table.selected,
    });
    const tableUrl = `/${environmentName}/table/${table.id}/`;
    const handleLinkClick = useCallback(
        (event: React.MouseEvent) => handleTableRowClick(table.id, event),
        [handleTableRowClick, table.id]
    );
    const tableFullName = useMemo(
        () => `${table.schema}.${table.name}`,
        [table]
    );
    const { isDragging, dragProps } = useTableNameDrag(tableFullName);

    const linkDOM = (
        <ListLink
            className={className}
            onClick={handleLinkClick}
            isRow
            title={table.displayName}
        />
    );

    return isDragging ? (
        linkDOM
    ) : (
        <PopoverHoverWrapper>
            {(showPopover, anchorElement) => (
                <>
                    <span {...dragProps}>{linkDOM}</span>

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
                                tableName={tableFullName}
                            />
                        </Popover>
                    )}
                </>
            )}
        </PopoverHoverWrapper>
    );
};

/**
 *
 * @param tableName Assumed this is the full name schema.table
 */
function useTableNameDrag(tableName: string) {
    const [{ isDragging }, dragRef] = useDrag({
        type: tableNameDraggableType,
        item: {
            type: tableNameDraggableType,
        },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    });

    const handleDragStart = useCallback(
        (e: React.DragEvent) => {
            e.dataTransfer.setData(tableNameDataTransferName, tableName);
        },
        [tableName]
    );

    return {
        isDragging,
        dragProps: {
            ref: dragRef,
            onDragStart: handleDragStart,
        },
    };
}
