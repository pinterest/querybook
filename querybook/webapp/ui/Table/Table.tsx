import React from 'react';
import classNames from 'classnames';
import { decorate } from 'core-decorators';
import memoizeOne from 'memoize-one';
import ReactTable, { Column, TableProps } from 'react-table';

import { titleize } from 'lib/utils';

import 'react-table/react-table.css';
import './Table.scss';

export type TableAlign = 'center' | 'left' | 'right';

export interface ITableProps extends Partial<TableProps> {
    rows: any[];
    cols: Array<Column | string>;
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

export class Table extends React.Component<ITableProps> {
    public static defaultProps = {
        showHeader: true,
        showAllRows: false,
    };

    @decorate(memoizeOne)
    public formatColumns(
        columns: Array<Column | string>,
        showHeader: boolean,
        formatCell?: ITableProps['formatCell'],
        sortCell?: ITableProps['sortCell'],
        widthObj?: Record<string, number>,
        alignObj?: Record<string, 'left' | 'right' | 'center'>
    ): Column[] {
        return columns.map((column: Column | string, columnIndex: number) => {
            let formattedColumn: Column;
            if (typeof column === 'string') {
                formattedColumn = {
                    Header: titleize(column, '_', ' '),
                    accessor: column,
                };
                if (widthObj && widthObj[column]) {
                    formattedColumn.minWidth = widthObj[column];
                }

                if (alignObj && alignObj[column]) {
                    formattedColumn.style = {
                        textAlign: alignObj[column],
                    };
                }
            } else {
                formattedColumn = column;
            }

            if (formatCell) {
                formattedColumn.Cell = this.formatCell.bind(
                    this,
                    formattedColumn.accessor,
                    columnIndex
                );
            }
            if (sortCell) {
                formattedColumn.sortMethod = sortCell.bind(null, columnIndex);
            }

            return formattedColumn;
        });
    }

    public formatCell(column: string, columnIndex: number, row) {
        return this.props.formatCell(columnIndex, column, row.row._original);
    }

    public render() {
        const {
            rows,
            cols,
            showHeader,
            stickyHeader,

            formatCell,
            sortCell,
            colNameToWidths,
            colNameToTextAlign,
            showAllRows,
            className,
            ...otherProps
        } = this.props;

        const combinedClassName = classNames({
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
                columns={this.formatColumns(
                    cols,
                    showHeader,
                    formatCell,
                    sortCell,
                    colNameToWidths,
                    colNameToTextAlign
                )}
                {...otherProps}
            />
        );
    }
}
