import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';

import { DraggableItem } from './DraggableItem';
import produce from 'immer';
import { arrayMove } from 'lib/utils';

interface IDraggableListProps<T> {
    renderItem: (index: number, itemProps: T) => any;
    items: T[];

    onMove: (fromIndex: number, toIndex: number) => void;
    className?: string;
}

export function DraggableList<T extends { id: any }>({
    renderItem,
    items,
    onMove,
    className,
}: IDraggableListProps<T>) {
    const [hoverItems, setHoverItems] = useState(items);

    const handleHoverMove = useCallback(
        (fromIndex: number, toIndex: number) => {
            setHoverItems(arrayMove(hoverItems, fromIndex, toIndex));
        },
        [hoverItems]
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
