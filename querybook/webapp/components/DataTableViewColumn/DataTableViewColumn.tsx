import { ContentState } from 'draft-js';
import React from 'react';

import { IDataTable } from 'const/metastore';
import { useResource } from 'hooks/useResource';
import { Nullable } from 'lib/typescript';
import { TableResource } from 'resource/table';
import { Loading } from 'ui/Loading/Loading';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { OrderByButton } from 'ui/OrderByButton/OrderByButton';
import { DataTableColumnCard } from './DataTableColumnCard';
import './DataTableViewColumn.scss';

export interface IDataTableViewColumnProps {
    table: IDataTable;
    numberOfRows: number;
    updateDataColumnDescription: (
        columnId: number,
        description: ContentState
    ) => any;
    onEditColumnDescriptionRedirect?: Nullable<() => Promise<void>>;
}

type ColumnOrderBy = 'alphabetical' | 'usage';

const COLUMN_STATS_USAGE_KEY = 'usage';

export const DataTableViewColumn: React.FunctionComponent<
    IDataTableViewColumnProps
> = ({
    updateDataColumnDescription,
    table = null,
    numberOfRows = null,
    onEditColumnDescriptionRedirect,
}) => {
    const [filterString, setFilterString] = React.useState('');
    const [orderColumnsBy, setOrderColumnsBy] =
        React.useState<ColumnOrderBy>('usage');
    const [orderColumnsByAsc, setOrderColumnsByAsc] = React.useState(false);
    const { data: tableColumns } = useResource(
        React.useCallback(
            () => TableResource.getColumnDetails(table.id),
            [table.id]
        )
    );

    const usageByColumnId = React.useMemo(
        () =>
            tableColumns?.reduce((acc, column) => {
                acc[column.id] =
                    column.stats?.find(
                        (stat) => stat.key === COLUMN_STATS_USAGE_KEY
                    )?.value ?? 0;
                return acc;
            }, {}),
        [tableColumns]
    );
    const filteredColumns = React.useMemo(() => {
        if (!tableColumns) {
            return [];
        }
        const filteredCols = tableColumns.filter((column) =>
            !!filterString
                ? column.name.toLowerCase().includes(filterString.toLowerCase())
                : true
        );
        if (numberOfRows != null) {
            filteredCols.splice(numberOfRows);
        }
        if (orderColumnsBy === 'alphabetical') {
            filteredCols.sort(
                (a, b) =>
                    (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1) *
                    (orderColumnsByAsc ? 1 : -1)
            );
        } else {
            filteredCols.sort(
                (a, b) =>
                    (usageByColumnId[a.id] > usageByColumnId[b.id] ? 1 : -1) *
                    (orderColumnsByAsc ? 1 : -1)
            );
        }
        return filteredCols;
    }, [
        tableColumns,
        filterString,
        numberOfRows,
        orderColumnsBy,
        orderColumnsByAsc,
        usageByColumnId,
    ]);

    if (!table || !tableColumns) {
        return <Loading />;
    }

    const sortButton = (
        <OrderByButton
            asc={orderColumnsByAsc}
            onAscToggle={() => setOrderColumnsByAsc((v) => !v)}
            orderByField="name"
            orderByFieldSymbol={
                orderColumnsBy === 'alphabetical' ? 'Aa' : 'Usage'
            }
            onOrderByFieldToggle={() =>
                setOrderColumnsBy((v) =>
                    v === 'alphabetical' ? 'usage' : 'alphabetical'
                )
            }
        />
    );

    const filterDOM = (
        <div className="DataTableViewSearchBar">
            <SearchBar
                value={filterString}
                onSearch={(s) => setFilterString(s)}
                isSearching={false}
                placeholder={`Find Columns`}
                autoFocus
                transparent
            />
            {sortButton}
        </div>
    );

    const columnDOM = filteredColumns.map((col) => (
        <DataTableColumnCard
            column={col}
            updateDataColumnDescription={updateDataColumnDescription}
            key={col.id}
            onEditColumnDescriptionRedirect={onEditColumnDescriptionRedirect}
        />
    ));

    return (
        <div className="DataTableViewColumn">
            {filterDOM}
            {columnDOM}
        </div>
    );
};
