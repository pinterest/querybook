import React, { useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { UserSettingsFontSizeToCSSFontSize } from 'const/font';
import { useImmer } from 'hooks/useImmer';
import { IColumnTransformer } from 'lib/query-result/types';
import { findColumnType } from 'lib/query-result/detector';

import { IStoreState } from 'redux/store/types';
import { Table } from 'ui/Table/Table';

import { getTransformersForType } from 'lib/query-result/transformer';
import { StatementResultTableColumn } from './StatementResultTableColumn';
import { useSortCell } from './useSortCell';
import { useFilterCell } from './useFilterCell';

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

export const StatementResultTable: React.FunctionComponent<{
    // If isPreview, then it is only showing partial results instead of
    // all rows
    isPreview?: boolean;

    data: string[][];
    paginate: boolean;
    maxNumberOfRowsToShow?: number;
}> = ({ data, paginate, maxNumberOfRowsToShow = 20, isPreview = false }) => {
    const [expandedColumn, toggleExpandedColumn] = useExpandedColumn();

    const tableFontSize = useTableFontSize();

    const rows = useMemo(() => data.slice(1), [data]);
    const columnTypes = useMemo(
        () =>
            data[0].map((col, index) =>
                findColumnType(
                    col,
                    rows.map((row) => row[index])
                )
            ),
        [data, rows]
    );

    const {
        getTransformerForColumn,
        setTransformerForColumn,
    } = useColumnTransformer(columnTypes);

    const {
        filteredRows,
        setFilterCondition,
        filterConditionByColumn,
    } = useFilterCell(rows);

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
                    const transformer = getTransformerForColumn(index);
                    return transformer
                        ? transformer.transform(row[index])
                        : row[index];
                }}
                sortCell={useSortCell(rows)}
            />
        </StyledTableWrapper>
    );
};

function useExpandedColumn() {
    const [expandedColumn, setExpandedColumn] = useImmer<
        Record<string, boolean>
    >({});
    const toggleExpandedColumn = useCallback((column: string) => {
        setExpandedColumn((old) => {
            if (column in old) {
                delete old[column];
            } else {
                old[column] = true;
            }
        });
    }, []);
    return [expandedColumn, toggleExpandedColumn] as const;
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
