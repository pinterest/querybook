import { ContentState } from 'draft-js';
import React from 'react';

import { IDataColumn, IDataTable } from 'const/metastore';
import { Nullable } from 'lib/typescript';
import { Loading } from 'ui/Loading/Loading';
import { SearchBar } from 'ui/SearchBar/SearchBar';

import { DataTableColumnCard } from './DataTableColumnCard';

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

    const filteredColumns = React.useMemo(() => {
        const filteredCols = tableColumns.filter((column) =>
            !!filterString
                ? column.name.toLowerCase().includes(filterString.toLowerCase())
                : true
        );
        if (numberOfRows != null) {
            filteredCols.splice(numberOfRows);
        }
        return filteredCols;
    }, [tableColumns, filterString, numberOfRows]);

    if (!table || !tableColumns) {
        return <Loading />;
    }

    const filterDOM = (
        <SearchBar
            value={filterString}
            onSearch={(s) => setFilterString(s)}
            isSearching={false}
            placeholder={`Find Columns`}
            hasIcon
            autoFocus
            className="mb8"
        />
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
