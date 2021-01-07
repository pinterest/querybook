import { bind } from 'lodash-decorators';
import React from 'react';

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

export class InfinityScroll<T> extends React.PureComponent<
    IInfinityScrollProps<T>
> {
    public static defaultProps = {
        labelField: 'name',
        itemClass: '',
        itemHeight: 24,
    };

    public state = {
        isLoadingMore: false,
    };

    private listRef: List;

    @bind
    public rowRenderer({
        index, // Index of row
        key, // Unique key within array of rendered rows
        style, // Style object to be applied to row (to position it);
        // This must be passed through to the rendered row element.
    }) {
        const {
            itemClass,
            itemRenderer,
            elements,
            labelField,
            onClick,
        } = this.props;

        if (index >= this.props.elements.length) {
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
            <span className={itemClass} onClick={onClick.bind(null, element)}>
                {element[labelField]}
            </span>
        );

        return (
            <div key={key} style={style}>
                {content}
            </div>
        );
    }

    @bind
    public isRowLoaded({ index }) {
        return index < this.props.elements.length;
    }

    @bind
    public handleLoadMoreRows() {
        return new Promise<void>((resolve) => {
            this.setState({ isLoadingMore: true }, async () => {
                try {
                    if (this.props.onLoadMore) {
                        await this.props.onLoadMore();
                    }
                } finally {
                    this.setState({ isLoadingMore: false });
                    resolve();
                }
            });
        });
    }

    public componentDidUpdate(prevProps) {
        if (this.props.elements !== prevProps.elements && this.listRef) {
            this.listRef.forceUpdateGrid();
        }
    }

    public render() {
        const { elements, itemHeight, className, hasMore } = this.props;
        const rowCount = hasMore ? elements.length + 1 : elements.length;

        return (
            <InfiniteLoader
                isRowLoaded={this.isRowLoaded}
                loadMoreRows={this.handleLoadMoreRows}
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
                                    this.listRef = ref;
                                }}
                                height={height}
                                width={width}
                                rowCount={rowCount}
                                rowHeight={itemHeight}
                                rowRenderer={this.rowRenderer}
                            />
                        )}
                    </AutoSizer>
                )}
            </InfiniteLoader>
        );
    }
}
