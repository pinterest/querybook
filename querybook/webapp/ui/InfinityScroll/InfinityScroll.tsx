import React, { CSSProperties, useCallback, useEffect, useRef } from 'react';

import { AutoSizer, List, InfiniteLoader } from 'react-virtualized';

export interface IInfinityScrollProps<T> {
    elements: T[];
    className?: string;

    labelField?: string;
    itemClass?: string;
    onClick?: (element: T) => any;

    itemRenderer?: (element: any) => React.ReactNode;
    itemHeight?: number;

    onLoadMore?: () => Promise<any>;
    // the actual number of elements, including not loaded
    hasMore?: boolean;
}

function InfinityScrollComponent<T>({
    labelField = 'name',
    itemClass = '',
    itemHeight = 24,

    elements,
    className,
    onClick,
    itemRenderer,

    onLoadMore,
    hasMore,
}: React.PropsWithChildren<IInfinityScrollProps<T>>) {
    const listRef = useRef<List>();

    const rowRenderer = useCallback(
        ({
            index, // Index of row
            key, // Unique key within array of rendered rows
            style, // Style object to be applied to row (to position it);
        }: // This must be passed through to the rendered row element.
        {
            index: number;
            key: string;
            style: CSSProperties;
        }) => {
            if (index >= elements.length) {
                return (
                    <div
                        key={key}
                        style={style}
                        className="InfiniteScroll-loader flex-center"
                    >
                        <div style={{ textAlign: 'center' }}>
                            <i className="fa fa-spinner fa-pulse" /> Loading
                        </div>
                    </div>
                );
            }

            const element = elements[index];

            const content = itemRenderer ? (
                itemRenderer(element)
            ) : (
                <span
                    className={itemClass}
                    onClick={onClick.bind(null, element)}
                >
                    {element[labelField]}
                </span>
            );

            return (
                <div key={key} style={style}>
                    {content}
                </div>
            );
        },
        [itemClass, itemRenderer, elements, labelField, onClick]
    );

    const isRowLoaded = useCallback(
        ({ index }: { index: number }) => index < elements.length,
        [elements.length]
    );
    const handleLoadMoreRows = useCallback(
        () =>
            new Promise<void>(async (resolve) => {
                try {
                    if (onLoadMore) {
                        await onLoadMore();
                    }
                } finally {
                    resolve();
                }
            }),
        [onLoadMore]
    );

    useEffect(() => {
        if (listRef.current) {
            listRef.current.forceUpdateGrid();
        }
    }, [elements]);

    const rowCount = hasMore ? elements.length + 1 : elements.length;

    return (
        <InfiniteLoader
            isRowLoaded={isRowLoaded}
            loadMoreRows={handleLoadMoreRows}
            rowCount={rowCount}
        >
            {({ onRowsRendered, registerChild }) => (
                <AutoSizer>
                    {({ height, width }) => (
                        <List
                            className={className}
                            onRowsRendered={onRowsRendered}
                            ref={(ref) => {
                                registerChild(ref);
                                listRef.current = ref;
                            }}
                            height={height}
                            width={width}
                            rowCount={rowCount}
                            rowHeight={itemHeight}
                            rowRenderer={rowRenderer}
                        />
                    )}
                </AutoSizer>
            )}
        </InfiniteLoader>
    );
}

export const InfinityScroll = React.memo(
    InfinityScrollComponent
) as typeof InfinityScrollComponent;
