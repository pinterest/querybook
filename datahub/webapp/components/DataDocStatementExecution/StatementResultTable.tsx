import React from 'react';
import { produce } from 'immer';

import { Table } from 'ui/Table/Table';
import { Level } from 'ui/Level/Level';
import { IconButton } from 'ui/Button/IconButton';

import './StatementResultTable.scss';

export const StatementResultTable: React.FunctionComponent<{
    data: string[][];
    paginate: boolean;
    maxNumberOfRowsToShow?: number;
}> = ({ data, paginate, maxNumberOfRowsToShow = 20 }) => {
    const [expandedColumn, setExpandedColumn] = React.useState<
        Record<string, any>
    >({});

    const columns = data[0].map((column, index) => ({
        Header: () => {
            const isExpanded = column in expandedColumn;
            return (
                <Level>
                    <span className="statement-result-table-title">
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
        <Table
            className="StatementResultTable -highlight force-scrollbar-x"
            defaultPageSize={
                paginate ? Math.min(maxNumberOfRowsToShow, rows.length) : null
            }
            showAllRows={!paginate}
            rows={rows}
            cols={columns}
            showPagination={showPagination}
            formatCell={(index, column, row) => row[index]}
            sortCell={(indx, column, a, b) => {
                const aValue = isNaN(a) ? String(a) : Number(a);
                const bValue = isNaN(a) ? String(b) : Number(b);
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            }}
        />
    );
};
