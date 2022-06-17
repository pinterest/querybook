import { uniqueId } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DropTargetMonitor } from 'react-dnd';

import { arrayMove } from 'lib/utils';

import { DraggableItem } from './DraggableItem';
import { IDragItem } from './types';

interface IDraggableListProps<T> {
    renderItem: (index: number, itemProps: T) => React.ReactNode;
    items: T[];

    onMove: (fromIndex: number, toIndex: number) => void;
    className?: string;

    // The type of item getting dragged
    itemType?: string;

    canDrop?: (item: IDragItem<T>, monitor: DropTargetMonitor) => boolean;
}

export function DraggableList<T extends { id: any }>({
    renderItem,
    items,
    onMove,
    className,
    canDrop,

    itemType,
}: IDraggableListProps<T>) {
    const [hoverItemsVersion, resetHoverItemsVersion] = useState(0);
    const draggableItemType = useMemo(
        () => itemType ?? uniqueId('DraggableItem'),
        [itemType]
    );

    const [hoverItems, setHoverItems] = useState(items);

    const handleHoverMove = useCallback(
        (fromIndex: number, toIndex: number) => {
            setHoverItems((oldHoverItems) =>
                arrayMove(oldHoverItems, fromIndex, toIndex)
            );
        },
        []
    );

    useEffect(() => {
        setHoverItems(items);
    }, [items, hoverItemsVersion]);

    const resetHoverItems = useCallback(() => {
        resetHoverItemsVersion((v) => v + 1);
    }, []);

    const idToOriginalIndex = useMemo(
        () =>
            items.reduce((hash, item, idx) => {
                hash[item.id] = idx;
                return hash;
            }, {}),
        [items]
    );

    const renderedChildren = hoverItems.map((itemProps, idx) => (
        <DraggableItem
            key={itemProps.id}
            onHoverMove={handleHoverMove}
            onMove={onMove}
            index={idx}
            originalIndex={idToOriginalIndex[itemProps.id]}
            draggableItemType={draggableItemType}
            itemInfo={itemProps}
            canDrop={canDrop}
            resetHoverItems={resetHoverItems}
        >
            {renderItem(idx, itemProps)}
        </DraggableItem>
    ));
    return (
        <ul className={'DraggableList ' + (className ?? '')}>
            {renderedChildren}
        </ul>
    );
}
