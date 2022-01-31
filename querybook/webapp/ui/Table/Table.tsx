import React, { useMemo } from 'react';
import clsx from 'clsx';
import ReactTable, { Column, TableProps } from 'react-table';

import { titleize } from 'lib/utils';

import 'react-table/react-table.css';
import './Table.scss';

export type TableAlign = 'center' | 'left' | 'right';
export type TableColumn = Column | string;
export interface ITableProps extends Partial<TableProps> {
    rows: any[];
    cols: TableColumn[];
    showHeader?: boolean;
    stickyHeader?: boolean;

    showAllRows?: boolean;

    colNameToWidths?: Record<string, number>;
    colNameToTextAlign?: Record<string, 'left' | 'right' | 'center'>;

    formatCell?: (
        columnIndex: number,
        column: string,
        row: any
    ) => React.ReactNode;

    sortCell?: (columnIdx: number, cellA: any, cellB: any) => -1 | 0 | 1;
}

export const Table = React.memo<ITableProps>(
    ({
        rows,
        cols,
        showHeader = true,
        stickyHeader = false,
        showAllRows = false,

        colNameToWidths,
        colNameToTextAlign,

        formatCell,
        sortCell,

        className,
        ...otherProps
    }) => {
        const handleFormatCell = useMemo(
            () =>
                formatCell
                    ? (column: string, columnIndex: number, row) =>
                          formatCell(columnIndex, column, row.row._original)
                    : null,
            [formatCell]
        );
        const columnDefs = useMemo(
            () =>
                cols.map((column: TableColumn, columnIndex: number) => {
                    let formattedColumn: Column;
                    if (typeof column === 'string') {
                        formattedColumn = {
                            Header: titleize(column, '_', ' '),
                            accessor: column,
                        };
                        if (colNameToWidths && colNameToWidths[column]) {
                            formattedColumn.minWidth = colNameToWidths[column];
                        }

                        if (colNameToTextAlign && colNameToTextAlign[column]) {
                            formattedColumn.style = {
                                textAlign: colNameToTextAlign[column],
                            };
                        }
                    } else {
                        formattedColumn = column;
                    }

                    if (handleFormatCell && !formattedColumn.Cell) {
                        formattedColumn.Cell = handleFormatCell.bind(
                            null,
                            formattedColumn.accessor,
                            columnIndex
                        );
                    }
                    if (sortCell) {
                        formattedColumn.sortMethod = sortCell.bind(
                            null,
                            columnIndex
                        );
                    }

                    return formattedColumn;
                }),
            [
                cols,
                colNameToWidths,
                colNameToTextAlign,
                handleFormatCell,
                sortCell,
            ]
        );

        const combinedClassName = clsx({
            Table: true,
            [className]: className,
            'hide-header': !showHeader,
            'sticky-header': stickyHeader,
        });

        if (showAllRows) {
            otherProps.pageSize = rows.length;
            otherProps.showPageSizeOptions = false;
            otherProps.showPagination = false;
        }

        return (
            <ReactTable
                className={combinedClassName}
                data={rows}
                columns={columnDefs}
                {...otherProps}
            />
        );
    }
);
