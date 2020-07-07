import { uniqueId } from 'lodash';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DraggableItem } from './DraggableItem';
import { arrayMove } from 'lib/utils';

interface IDraggableListProps<T> {
    renderItem: (index: number, itemProps: T) => any;
    items: T[];

    onMove: (fromIndex: number, toIndex: number) => void;
    className?: string;

    // The type of item getting dragged
    itemType?: string;
}

export function DraggableList<T extends { id: any }>({
    renderItem,
    items,
    onMove,
    className,

    itemType,
}: IDraggableListProps<T>) {
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
    }, [items]);

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
