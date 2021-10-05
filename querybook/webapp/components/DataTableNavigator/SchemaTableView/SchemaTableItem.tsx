import React, { useEffect, useState, useRef } from 'react';
import { Title } from 'ui/Title/Title';
import { IconButton } from 'ui/Button/IconButton';
import { InfinityScroll } from 'ui/InfinityScroll/InfinityScroll';
import type { ITableSearchResult } from 'redux/dataTableSearch/types';

function calculateMaxHeight(amountOfItems = 1) {
    const TABLE_ITEM_HEIGHT = 28;
    const MAX_VISIBLE_AMOUNT = 10;
    return amountOfItems >= MAX_VISIBLE_AMOUNT
        ? TABLE_ITEM_HEIGHT * MAX_VISIBLE_AMOUNT
        : amountOfItems * TABLE_ITEM_HEIGHT;
}

export const SchemaTableItem: React.FC<{
    name: string;
    onLoadMore: () => Promise<any>;
    data: ITableSearchResult[];
    total: number;
    tableRowRenderer: (table: ITableSearchResult) => React.ReactNode;
}> = ({ name, onLoadMore, data, total, tableRowRenderer }) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    return (
        <div className={'DataDocNavigatorSection'}>
            <div
                style={{ borderBottom: '1px solid #e5e1e1' }}
                className="horizontal-space-between navigator-header pl8"
            >
                <div
                    className="flex1 flex-row"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <Title size={7}>{name}</Title>
                </div>
                <div className="flex-row">
                    <IconButton
                        onClick={() => setIsExpanded(!isExpanded)}
                        icon={isExpanded ? 'chevron-down' : 'chevron-right'}
                        className="ml4"
                    />
                </div>
            </div>

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
                            itemHeight={28}
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
