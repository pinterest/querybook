import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from './types';

interface IProps {
    className?: string;
}
export const DraggableItem: React.FC<IProps> = ({ children, className }) => {
    const [{ isDragging }, drag] = useDrag({
        item: { type: ItemTypes.DraggableItem },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    });
    return (
        <li
            className={'DraggableItem ' + (className ?? '')}
            style={{ opacity: isDragging ? 0.8 : 1 }}
        >
            {children}
        </li>
    );
};
