import { startCase } from 'lodash';
import React, { useMemo, useState } from 'react';
import styled from 'styled-components';

import { SchemaTableSortKey } from 'const/metastore';
import type { ITableSearchResult } from 'redux/dataTableSearch/types';
import { IconButton } from 'ui/Button/IconButton';
import { InfinityScroll } from 'ui/InfinityScroll/InfinityScroll';
import { OrderByButton } from 'ui/OrderByButton/OrderByButton';
import { Title } from 'ui/Title/Title';

import type { ITableResultWithSelection } from '../DataTableNavigator';

import './SchemaTableItem.scss';

const TABLE_ITEM_HEIGHT = 28;
const MAX_VISIBLE_AMOUNT = 10;

function calculateMaxHeight(numberOfItems = 1) {
    return Math.min(numberOfItems, MAX_VISIBLE_AMOUNT) * TABLE_ITEM_HEIGHT;
}

const StyledItem = styled.div`
    height: 32px;
`;

const SchemaIconButton = styled(IconButton)`
    padding: 4px;
`;

function prepareSchemaNames(
    tables: ITableSearchResult[],
    selectedTableId: number
): ITableResultWithSelection[] {
    if (!tables) {
        return [];
    }

    return tables.map((table) => ({
        ...table,
        selected: table.id === selectedTableId,
        full_name: table.name,
    }));
}

export const SchemaTableItem: React.FC<{
    name: string;
    onLoadMore: () => Promise<any>;
    tables: ITableSearchResult[];
    selectedTableId: number;
    total: number;
    tableRowRenderer: (table: ITableSearchResult) => React.ReactNode;
    onSortChanged: (
        sortKey?: SchemaTableSortKey | null,
        sortAsc?: boolean | null
    ) => void;
    sortOrder: {
        asc: boolean;
        key: SchemaTableSortKey;
    };
}> = ({
    name,
    onLoadMore,
    tables,
    selectedTableId,
    total,
    tableRowRenderer,
    onSortChanged,
    sortOrder,
}) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const data = useMemo(
        () => prepareSchemaNames(tables, selectedTableId),
        [tables, selectedTableId]
    );

    return (
        <div className="SchemaTableItem mb12">
            <StyledItem className="horizontal-space-between navigator-header pl8">
                <div
                    className="schema-name flex1 flex-row"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <Title size="small" className="one-line-ellipsis">
                        {name}
                    </Title>
                </div>
                <OrderByButton
                    asc={sortOrder.asc}
                    orderByField={startCase(sortOrder.key)}
                    orderByFieldSymbol={sortOrder.key === 'name' ? 'Aa' : 'Is'}
                    onAscToggle={() => onSortChanged(null, !sortOrder.asc)}
                    onOrderByFieldToggle={() =>
                        onSortChanged(
                            sortOrder.key === 'name'
                                ? 'importance_score'
                                : 'name'
                        )
                    }
                />

                <div className="flex-row">
                    <SchemaIconButton
                        onClick={() => setIsExpanded(!isExpanded)}
                        icon={isExpanded ? 'ChevronDown' : 'ChevronRight'}
                    />
                </div>
            </StyledItem>

            {isExpanded && (
                <div className="board-scroll-wrapper">
                    {total === 0 ? (
                        <div className="empty-section-message">
                            No tables in {name}
                        </div>
                    ) : (
                        <InfinityScroll
                            elements={data}
                            onLoadMore={onLoadMore}
                            hasMore={!total || total > data.length}
                            itemRenderer={tableRowRenderer}
                            itemHeight={TABLE_ITEM_HEIGHT}
                            defaultListHeight={calculateMaxHeight(total)}
                            autoSizerStyles={{
                                height: `${calculateMaxHeight(total)}px`,
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
};
