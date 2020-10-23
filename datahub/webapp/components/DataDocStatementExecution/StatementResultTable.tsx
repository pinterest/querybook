import { produce } from 'immer';
import classNames from 'classnames';
import React, {
    useRef,
    useMemo,
    useState,
    useCallback,
    useEffect,
} from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { UserSettingsFontSizeToCSSFontSize } from 'const/font';
import { IColumnTransformer } from 'lib/query-result/types';
import { findColumnType } from 'lib/query-result/detector';
import { isNumeric } from 'lib/utils/number';
import { IStoreState } from 'redux/store/types';
import { Table } from 'ui/Table/Table';
import { Level } from 'ui/Level/Level';
import { IconButton } from 'ui/Button/IconButton';
import { StatementResultColumnInfo } from './StatementResultColumnInfo';
import { getTransformersForType } from 'lib/query-result/transformer';
import { Dropdown } from 'ui/Dropdown/Dropdown';

const StyledTableWrapper = styled.div.attrs({
    className: 'StatementResultTable',
})`
    .Table {
        font-family: var(--family-monospace);
        font-size: ${(props) => props.fontSize ?? 'var(--xsmall-text-size)'};
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
                color: var(--color-accent-text);
            }
        }

        &:hover .hidden-button {
            display: inline-flex;
        }
    }
`;

export const StatementResultTable: React.FunctionComponent<{
    // If isPreview, then it is only showing partial results instead of
    // all rows
    isPreview?: boolean;

    data: string[][];
    paginate: boolean;
    maxNumberOfRowsToShow?: number;
}> = ({ data, paginate, maxNumberOfRowsToShow = 20, isPreview = false }) => {
    const [expandedColumn, setExpandedColumn] = React.useState<
        Record<string, boolean>
    >({});
    const [columnTransformerByIndex, setColumnTransformer] = useState<
        Record<string, IColumnTransformer>
    >({});

    const tableFontSize = useSelector(
        (state: IStoreState) =>
            UserSettingsFontSizeToCSSFontSize[
                state.user.computedSettings['result_font_size']
            ]
    );

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
    const defaultColTransformer = useMemo(
        () => columnTypes.map((t) => getTransformersForType(t)[1]),
        [columnTypes]
    );
    const setTransformerForColumn = useCallback(
        (colIndex: number, transformer: IColumnTransformer) => {
            setColumnTransformer((old) => ({
                ...old,
                [colIndex]: transformer,
            }));
        },
        []
    );

    const columns = data[0].map((column, index) => ({
        Header: () => (
            <StatementResultTableColumn
                column={column}
                expandedColumn={expandedColumn}
                setExpandedColumn={setExpandedColumn}
                rows={rows}
                colIndex={index}
                colType={columnTypes[index]}
                isPreview={isPreview}
                setTransformerForColumn={setTransformerForColumn}
                columnTransformer={
                    index in columnTransformerByIndex
                        ? columnTransformerByIndex[index]
                        : defaultColTransformer[index]
                }
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
                stickyHeader
                className="-highlight force-scrollbar-x"
                defaultPageSize={
                    paginate
                        ? Math.min(maxNumberOfRowsToShow, rows.length)
                        : null
                }
                showAllRows={!paginate}
                rows={rows}
                cols={columns}
                showPagination={showPagination}
                formatCell={(index, column, row) => {
                    const transformer =
                        index in columnTransformerByIndex
                            ? columnTransformerByIndex[index]
                            : defaultColTransformer[index];
                    return transformer
                        ? transformer.transform(row[index])
                        : row[index];
                }}
                sortCell={(a, b) => {
                    if (a == null || a === 'null') {
                        return -1;
                    } else if (b == null || b === 'null') {
                        return 1;
                    }
                    const aValue = isNumeric(a) ? Number(a) : String(a);
                    const bValue = isNumeric(a) ? Number(b) : String(b);
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                }}
            />
        </StyledTableWrapper>
    );
};

function useLastNotNull<T>(value: T): T {
    const [s, set] = useState(null);
    useEffect(() => {
        if (value != null) {
            set(value);
        }
    }, [value]);

    return s;
}

const StatementResultTableColumn: React.FC<{
    column: string;
    expandedColumn: Record<string, boolean>;
    setExpandedColumn: (c: Record<string, boolean>) => any;

    // These props are for the column info
    colIndex: number;
    colType: string;
    rows: any[][];
    isPreview: boolean;
    columnTransformer?: IColumnTransformer;
    setTransformerForColumn: (
        index: number,
        transformer: IColumnTransformer
    ) => any;
}> = ({
    column,
    expandedColumn,
    setExpandedColumn,

    colIndex,
    colType,
    rows,
    isPreview,

    columnTransformer,
    setTransformerForColumn,
}) => {
    const isExpanded = column in expandedColumn;

    const lastColumnTransformer = useLastNotNull(columnTransformer);
    const boundSetTransformerForColumn = useCallback(
        (transformer: IColumnTransformer | null) =>
            setTransformerForColumn(colIndex, transformer),
        [setTransformerForColumn, colIndex]
    );

    return (
        <Level className="result-table-header">
            <span
                className={`statement-result-table-title one-line-ellipsis ${
                    isExpanded ? 'expanded' : ''
                }`}
            >
                {column}
            </span>
            <div className="flex-row">
                <IconButton
                    className={classNames({
                        'column-button': true,
                        'expand-column-button': true,
                        'hidden-button': !isExpanded,
                    })}
                    noPadding
                    icon={isExpanded ? 'minimize-2' : 'maximize-2'}
                    size={14}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        setExpandedColumn(
                            produce(expandedColumn, (draft) => {
                                if (isExpanded) {
                                    delete draft[column];
                                } else {
                                    draft[column] = true;
                                }
                            })
                        );
                    }}
                />
                <Dropdown
                    usePortal
                    isRight
                    isUp
                    customButtonRenderer={() => (
                        <IconButton
                            className={classNames({
                                'column-button': true,
                                'active-button': !!columnTransformer,
                                'hidden-button': !columnTransformer,
                            })}
                            noPadding
                            icon={'zap'}
                            size={14}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (columnTransformer) {
                                    // turn off
                                    boundSetTransformerForColumn(null);
                                } else {
                                    // turn on
                                    if (lastColumnTransformer) {
                                        // turn on the last active transformer
                                        boundSetTransformerForColumn(
                                            lastColumnTransformer
                                        );
                                    } else {
                                        // if not last turn on the one with highest priority
                                        const transformer = getTransformersForType(
                                            colType
                                        )[0][0];
                                        if (transformer) {
                                            boundSetTransformerForColumn(
                                                transformer
                                            );
                                        }
                                    }
                                }
                            }}
                        />
                    )}
                >
                    <div
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <StatementResultColumnInfo
                            rows={rows}
                            colIndex={colIndex}
                            colType={colType}
                            isPreview={isPreview}
                            setTransformer={boundSetTransformerForColumn}
                            transformer={columnTransformer}
                        />
                    </div>
                </Dropdown>
            </div>
        </Level>
    );
};
