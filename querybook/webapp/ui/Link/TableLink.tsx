import React, { useCallback } from 'react';
import { StyledLink } from './Link';
import { useDrag } from 'react-dnd';

export interface ILinkProps {
    onClick: (to: React.MouseEvent) => any;
    fullDBName: string;
}

export const TableLink: React.FC<ILinkProps> = ({
    onClick,
    children,
    fullDBName,
}) => {
    const [, drag] = useDrag({
        type: 'dbName',
        item: {
            type: 'dbName',
        },
    });

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            if (e.button !== 0) {
                // If it is not a left click, ignore
                return;
            }

            onClick(e);
        },
        [onClick]
    );

    const handleDragStart = useCallback(
        (e) => {
            e.dataTransfer.setData('fullDBName', fullDBName);
        },
        [fullDBName]
    );

    return (
        <StyledLink
            ref={drag}
            onDragStart={handleDragStart}
            onMouseDown={handleClick}
        >
            {children}
        </StyledLink>
    );
};
