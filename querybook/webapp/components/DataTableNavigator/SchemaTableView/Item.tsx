import React, { useState, useRef, useEffect } from 'react';
import { InfiniteLoader, List, AutoSizer } from 'react-virtualized';
import { Title } from 'ui/Title/Title';
import { IconButton } from 'ui/Button/IconButton';

export default ({ name, onLoadMore, data, total, tableRowRenderer }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const listRef = useRef(null);

    const rowRenderer = (params) => {
        if (!data[params.index]) {
            return;
        }

        return tableRowRenderer(data[params.index]);
    };

    useEffect(() => {
        if (listRef.current) {
            listRef.current.forceUpdateGrid();
        }
    }, [data]);

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
                <InfiniteLoader
                    isRowLoaded={({ index }: { index: number }) => data[index]}
                    loadMoreRows={onLoadMore}
                    rowCount={total}
                >
                    {({ onRowsRendered, registerChild }) => (
                        <List
                            onRowsRendered={onRowsRendered}
                            ref={(ref) => {
                                registerChild(ref);
                                listRef.current = ref;
                            }}
                            height={70}
                            width={270}
                            rowCount={total}
                            rowHeight={15}
                            rowRenderer={rowRenderer}
                        />
                    )}
                </InfiniteLoader>
            )}
        </div>
    );
};
