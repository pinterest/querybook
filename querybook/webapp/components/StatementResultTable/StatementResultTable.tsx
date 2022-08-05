import React, { useCallback, useImperativeHandle, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { UserSettingsFontSizeToCSSFontSize } from 'const/font';
import { useImmer } from 'hooks/useImmer';
import { getColumnTypesForTable } from 'lib/query-result/detector';
import { isCellValNull } from 'lib/query-result/helper';
import { getTransformersForType } from 'lib/query-result/transformer';
import { IColumnTransformer } from 'lib/query-result/types';
import { IStoreState } from 'redux/store/types';
import { Table } from 'ui/Table/Table';

import { StatementResultTableColumn } from './StatementResultTableColumn';
import { useFilterCell } from './useFilterCell';
import { useSortCell } from './useSortCell';

const StyledTableWrapper = styled.div.attrs({
    className: 'StatementResultTable',
})`
    .Table {
        font-size: ${(props) => props.fontSize ?? 'var(--small-text-size)'};
        margin: 8px 0px;
        text-transform: none;

        .statement-result-table-title {
            text-align: left;

            &.expanded {
                white-space: pre-wrap;
                word-break: break-all;
            }
        }

        .rt-resizer {
            width: 16px;
            right: -8px;
        }
    }

    .result-table-header {
        .column-button {
            padding: 0px 1px;

            &.expand-column-button .Icon {
                transform: rotate(45deg);
            }
            &.hidden-button {
                display: none;
            }
            &.active-button {
                color: var(--color-accent);
            }
        }

        .column-menu-buttons .column-button {
            margin-left: 2px;
        }

        &:hover .hidden-button {
            display: inline-flex;
        }
    }
`;

function useTableFontSize() {
    return useSelector(
        (state: IStoreState) =>
            UserSettingsFontSizeToCSSFontSize[
                state.user.computedSettings['result_font_size']
            ]
    );
}

export interface IStatementResultTableHandles {
    toggleAllExpandedColumns: (expand: boolean) => void;
}

interface IStatementResultTableProps {
    // If isPreview, then it is only showing partial results instead of
    // all rows
    isPreview?: boolean;

    data: string[][];
    paginate: boolean;
    maxNumberOfRowsToShow?: number;
}

export const StatementResultTable = React.forwardRef<
    IStatementResultTableHandles,
    IStatementResultTableProps
>(({ data, paginate, maxNumberOfRowsToShow = 20, isPreview = false }, ref) => {
    const [expandedColumn, toggleExpandedColumn, setExpandedColumn] =
        useExpandedColumn();

    const tableFontSize = useTableFontSize();

    const rows = useMemo(() => data.slice(1), [data]);
    const columnTypes = useMemo(
        () => getColumnTypesForTable(data[0], rows),
        [data, rows]
    );

    const { getTransformerForColumn, setTransformerForColumn } =
        useColumnTransformer(columnTypes);

    const { filteredRows, setFilterCondition, filterConditionByColumn } =
        useFilterCell(rows);

    const toggleAllExpandedColumns = useCallback(
        (expand: boolean) => {
            const columnNames = data[0];
            setExpandedColumn((old) => {
                columnNames.forEach((columnName) => {
                    if (expand) {
                        old[columnName] = true;
                    } else if (columnName in old) {
                        delete old[columnName];
                    }
                });
            });
        },
        [data, setExpandedColumn]
    );

    useImperativeHandle(ref, () => ({
        toggleAllExpandedColumns,
    }));

    const columns = data[0].map((column, index) => ({
        Header: () => (
            <StatementResultTableColumn
                column={column}
                expandedColumn={expandedColumn}
                toggleExpandedColumn={toggleExpandedColumn}
                filteredRows={filteredRows}
                colIndex={index}
                colType={columnTypes[index]}
                isPreview={isPreview}
                setTransformerForColumn={setTransformerForColumn}
                columnTransformer={getTransformerForColumn(index)}
                setFilterCondition={setFilterCondition}
                filterCondition={filterConditionByColumn[index]}
            />
        ),
        accessor: String(index),
        minWidth: 150,
        style: {
            ...(column in expandedColumn
                ? {
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                  }
                : {
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                  }),
        },
    }));

    const showPagination = rows.length > maxNumberOfRowsToShow && paginate;

    return (
        <StyledTableWrapper fontSize={tableFontSize}>
            <Table
                minRows={0}
                pageSize={
                    rows.length <= maxNumberOfRowsToShow
                        ? rows.length
                        : undefined
                }
                stickyHeader
                className="-highlight force-scrollbar-x"
                defaultPageSize={
                    paginate
                        ? Math.min(maxNumberOfRowsToShow, rows.length)
                        : null
                }
                showAllRows={!paginate}
                rows={filteredRows}
                cols={columns}
                showPagination={showPagination}
                formatCell={(index, column, row) => {
                    const value = row[index];
                    if (isCellValNull(value)) {
                        return value;
                    }

                    const transformer = getTransformerForColumn(index);
                    return transformer ? transformer.transform(value) : value;
                }}
                sortCell={useSortCell(rows)}
            />
        </StyledTableWrapper>
    );
});

function useExpandedColumn() {
    const [expandedColumn, setExpandedColumn] = useImmer<
        Record<string, boolean>
    >({});
    const toggleExpandedColumn = useCallback(
        (column: string) => {
            setExpandedColumn((old) => {
                if (column in old) {
                    delete old[column];
                } else {
                    old[column] = true;
                }
            });
        },
        [setExpandedColumn]
    );
    return [expandedColumn, toggleExpandedColumn, setExpandedColumn] as const;
}

function useColumnTransformer(columnTypes: string[]) {
    const [columnTransformerByIndex, setColumnTransformer] = useImmer<
        Record<string, IColumnTransformer>
    >({});

    const defaultColTransformer = useMemo(
        () => columnTypes.map((t) => getTransformersForType(t)[1]),
        [columnTypes]
    );
    const setTransformerForColumn = useCallback(
        (colIndex: number, transformer: IColumnTransformer) => {
            setColumnTransformer((old) => {
                old[colIndex] = transformer;
            });
        },
        []
    );
    const getTransformerForColumn = useCallback(
        (index: number) =>
            index in columnTransformerByIndex
                ? columnTransformerByIndex[index]
                : defaultColTransformer[index],
        [columnTransformerByIndex, defaultColTransformer]
    );

    return {
        setTransformerForColumn,
        getTransformerForColumn,
    };
}
