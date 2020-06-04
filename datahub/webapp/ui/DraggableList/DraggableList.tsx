import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableItem } from './DraggableItem';

interface IDraggableListProps<T> {
    children: (index: number, itemProps: T) => React.ReactNode;
    items: T[];

    onMove: (fromIndex: number, toIndex: number) => void;
    className?: string;
}

export function DraggableList<T>({
    children,
    items,
    onMove,
    className,
}: IDraggableListProps<T>): React.ReactNode {
    const renderedChildren = items.map((itemProps, idx) => (
        <DraggableItem key={idx}>{children(idx, itemProps)}</DraggableItem>
    ));
    return (
        <DndProvider backend={HTML5Backend}>
            <ul className={'DraggableList ' + (className ?? '')}>
                {renderedChildren}
            </ul>
        </DndProvider>
    );
}
