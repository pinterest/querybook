import { startCase } from 'lodash';
import React, { useState, useMemo } from 'react';
import styled from 'styled-components';

import { SchemaTableSortKey } from 'const/metastore';
import { Title } from 'ui/Title/Title';
import { IconButton } from 'ui/Button/IconButton';
import { InfinityScroll } from 'ui/InfinityScroll/InfinityScroll';
import type { ITableSearchResult } from 'redux/dataTableSearch/types';
import type { ITableResultWithSelection } from '../DataTableNavigator';
import { OrderByButton } from 'ui/OrderByButton/OrderByButton';

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
    const data = useMemo(() => prepareSchemaNames(tables, selectedTableId), [
        tables,
        selectedTableId,
    ]);

    return (
        <div className={'DataDocNavigatorSection'}>
            <StyledItem className="horizontal-space-between navigator-header pl8">
                <div
                    className="flex1 flex-row"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <Title size={7}>{name}</Title>
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
                        icon={isExpanded ? 'chevron-down' : 'chevron-right'}
                    />
                </div>
            </StyledItem>

            {isExpanded && (
                <div className="board-scroll-wrapper">
                    {total === 0 ? (
                        <div className="ph12">No items in this section.</div>
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
