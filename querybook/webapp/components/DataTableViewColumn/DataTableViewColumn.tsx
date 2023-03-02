import { ContentState } from 'draft-js';
import React from 'react';

import { IDataColumn, IDataTable } from 'const/metastore';
import { Nullable } from 'lib/typescript';
import { Loading } from 'ui/Loading/Loading';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { OrderByButton } from 'ui/OrderByButton/OrderByButton';

import { DataTableColumnCard } from './DataTableColumnCard';
import './DataTableViewColumn.scss';

export interface IDataTableViewColumnProps {
    table: IDataTable;
    tableColumns: IDataColumn[];
    numberOfRows: number;
    updateDataColumnDescription: (
        columnId: number,
        description: ContentState
    ) => any;
    onEditColumnDescriptionRedirect?: Nullable<() => Promise<void>>;
}

export const DataTableViewColumn: React.FunctionComponent<
    IDataTableViewColumnProps
> = ({
    updateDataColumnDescription,
    table = null,
    tableColumns = [],
    numberOfRows = null,
    onEditColumnDescriptionRedirect,
}) => {
    const [filterString, setFilterString] = React.useState('');
    const [orderColumnsBy, setOrdeColumnsBy] = React.useState(true);
    const [orderBoardBy, setOrderBoardBy] = React.useState(false);

    const filteredColumns = React.useMemo(() => {
        const filteredCols = tableColumns.filter((column) =>
            !!filterString
                ? column.name.toLowerCase().includes(filterString.toLowerCase())
                : true
        );
        if (numberOfRows != null) {
            filteredCols.splice(numberOfRows);
        }
        if (orderBoardBy) {
            filteredCols.sort(
                (a, b) =>
                    (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1) *
                    (orderColumnsBy ? 1 : -1)
            );
        }
        return filteredCols;
    }, [
        tableColumns,
        filterString,
        numberOfRows,
        orderColumnsBy,
        orderBoardBy,
    ]);

    if (!table || !tableColumns) {
        return <Loading />;
    }

    const sortButton = (
        <OrderByButton
            asc={orderColumnsBy}
            hideAscToggle={!orderBoardBy}
            onAscToggle={() => setOrdeColumnsBy((v) => !v)}
            orderByField="name"
            orderByFieldSymbol={orderBoardBy ? 'Aa' : 'Default'}
            onOrderByFieldToggle={() => setOrderBoardBy((v) => !v)}
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
