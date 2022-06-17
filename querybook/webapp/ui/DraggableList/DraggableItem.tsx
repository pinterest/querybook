import React, { useRef } from 'react';
import { DropTargetMonitor, useDrag, useDrop, XYCoord } from 'react-dnd';

import { IDragItem } from './types';

interface IDraggableItemProps<T> {
    className?: string;
    onHoverMove: (from: number, to: number) => void;
    onMove: (from: number, to: number) => void;
    index: number;
    originalIndex: number; // index before drag and drop
    draggableItemType: string;
    resetHoverItems: () => void;
    // the raw item
    itemInfo: Record<string, unknown>;
    canDrop?: (item: IDragItem<T>, monitor: DropTargetMonitor) => boolean;
}

export function DraggableItem<T extends { id: any }>({
    children,
    className,
    index,
    originalIndex,
    onHoverMove,
    onMove,
    draggableItemType,
    resetHoverItems,

    itemInfo,
    canDrop,
}: IDraggableItemProps<T> & { children: React.ReactNode }) {
    const ref = useRef<HTMLLIElement>(null);
    const [{ isDragging }, drag] = useDrag({
        type: draggableItemType,
        item: { type: draggableItemType, index, originalIndex, itemInfo },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
        end: (_, monitor) => {
            resetHoverItems();
        },
    });
    const [, drop] = useDrop({
        accept: draggableItemType,
        canDrop,
        drop: (item: IDragItem) => {
            onMove(item.originalIndex, item.index);
        },
        hover: (item: IDragItem, monitor: DropTargetMonitor) => {
            if (!ref.current) {
                return;
            }
            if (!monitor.canDrop()) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;
            if (dragIndex === hoverIndex) {
                return;
            }
            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect();

            // Get vertical middle
            const hoverMiddleY =
                (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

            // Determine mouse position
            const clientOffset = monitor.getClientOffset();

            // Get pixels to the top
            const hoverClientY =
                (clientOffset as XYCoord).y - hoverBoundingRect.top;

            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%

            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }

            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }

            // Time to actually perform the action
            onHoverMove(dragIndex, hoverIndex);

            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex;
        },
    });
    drag(drop(ref));

    // To hide the item that is being dragged
    const opacity = isDragging ? 0 : 1;

    return (
        <li
            className={'DraggableItem ' + (className ?? '')}
            style={{ opacity }}
            ref={ref}
        >
            {children}
        </li>
    );
}
