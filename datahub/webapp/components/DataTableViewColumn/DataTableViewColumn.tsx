import React from 'react';
import { ContentState } from 'draft-js';
import { Column } from 'react-table';

import { IDataColumn, IDataTable } from 'const/metastore';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';
import { Loading } from 'ui/Loading/Loading';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { Table } from 'ui/Table/Table';

const wordWrapStyle = { whiteSpace: 'pre-wrap', wordBreak: 'break-all' };

const columnsTableColumns: Column[] = [
    { Header: 'Name', accessor: 'name', maxWidth: 200, style: wordWrapStyle },
    { Header: 'Type', accessor: 'type', maxWidth: 150, style: wordWrapStyle },
    {
        Header: 'Definition',
        accessor: 'comment',
        style: wordWrapStyle,
    },
    { Header: 'User Comment', accessor: 'description' },
];

export interface IDataTableViewColumnProps {
    table: IDataTable;
    tableColumns: IDataColumn[];
    numberOfRows: number;
    updateDataColumnDescription: (
        columnId: number,
        description: ContentState
    ) => any;
}

export interface IDataTableViewColumnState {
    filterString: string;
}

export const DataTableViewColumn: React.FunctionComponent<IDataTableViewColumnProps> = ({
    updateDataColumnDescription,
    table = null,
    tableColumns = [],
    numberOfRows = null,
}) => {
    const [filterString, setFilterString] = React.useState('');
    const [rows, setRows] = React.useState([]);

    React.useEffect(() => {
        const filteredRows = tableColumns.filter((column) =>
            !!filterString ? column.name.includes(filterString) : true
        );
        if (numberOfRows != null) {
            filteredRows.splice(numberOfRows);
        }
        setRows(filteredRows);
    }, [tableColumns, filterString, numberOfRows]);

    const formatCells = (index: number, column: string, row: IDataColumn) => {
        const value =
            column === 'description' ? (
                <EditableTextField
                    value={row[column] as ContentState}
                    onSave={updateDataColumnDescription.bind(null, row.id)}
                />
            ) : (
                row[column]
            );
        return value;
    };

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
        />
    );

    const tableDOM = (
        <Table
            className="data-table-column-table"
            showAllRows={true}
            rows={rows}
            cols={columnsTableColumns}
            formatCell={formatCells}
        />
    );

    return (
        <div className="TableViewColumn">
            {filterDOM}
            {tableDOM}
        </div>
    );
};
