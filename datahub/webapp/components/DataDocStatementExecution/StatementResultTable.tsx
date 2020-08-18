import { produce } from 'immer';
import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { UserSettingsFontSizeToCSSFontSize } from 'const/font';
import { IStoreState } from 'redux/store/types';
import { Table } from 'ui/Table/Table';
import { Level } from 'ui/Level/Level';
import { IconButton } from 'ui/Button/IconButton';

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

    .expand-column-button {
        transform: rotate(45deg);
        padding: 0px 1px;
    }
`;

export const StatementResultTable: React.FunctionComponent<{
    data: string[][];
    paginate: boolean;
    maxNumberOfRowsToShow?: number;
}> = ({ data, paginate, maxNumberOfRowsToShow = 20 }) => {
    const [expandedColumn, setExpandedColumn] = React.useState<
        Record<string, any>
    >({});
    const tableFontSize = useSelector(
        (state: IStoreState) =>
            UserSettingsFontSizeToCSSFontSize[
                state.user.computedSettings['result_font_size']
            ]
    );

    const columns = data[0].map((column, index) => ({
        Header: () => {
            const isExpanded = column in expandedColumn;
            return (
                <Level>
                    <span
                        className={`statement-result-table-title one-line-ellipsis ${
                            isExpanded ? 'expanded' : ''
                        }`}
                    >
                        {column}
                    </span>
                    <IconButton
                        className="expand-column-button"
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
                </Level>
            );
        },
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
    const rows = data.slice(1);
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
                formatCell={(index, column, row) => row[index]}
                sortCell={(a, b) => {
                    if (a == null || a === 'null') {
                        return -1;
                    } else if (b == null || b === 'null') {
                        return 1;
                    }
                    const aValue = isNaN(a) ? String(a) : Number(a);
                    const bValue = isNaN(a) ? String(b) : Number(b);
                    return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
                }}
            />
        </StyledTableWrapper>
    );
};
