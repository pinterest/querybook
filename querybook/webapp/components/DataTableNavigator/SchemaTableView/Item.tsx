import React, { useState } from 'react';
import { Title } from 'ui/Title/Title';
import { IconButton } from 'ui/Button/IconButton';
import { InfinityScroll } from 'ui/InfinityScroll/InfinityScroll';
import type { ITableSearchResult } from 'redux/dataTableSearch/types';

export const SchemaTableItem: React.FC<{
    name: string;
    onLoadMore: () => Promise<any>;
    data: ITableSearchResult[];
    total: number;
    tableRowRenderer: (item: any) => React.ReactNode;
}> = ({ name, onLoadMore, data, total, tableRowRenderer }) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    return (
        <div className={'DataDocNavigatorSection'}>
            <div className="horizontal-space-between navigator-header pl8">
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
                    <InfinityScroll
                        elements={data}
                        onLoadMore={onLoadMore}
                        hasMore={total > data.length}
                        itemRenderer={tableRowRenderer}
                        itemHeight={28}
                        defaultListHeight={120}
                        autoSizerStyles={{ height: '120px' }}
                    />
                </div>
            )}
        </div>
    );
};
