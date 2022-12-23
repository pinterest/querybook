import clsx from 'clsx';
import React from 'react';

import { Icon } from 'ui/Icon/Icon';

import './DraggableIcon.scss';

export interface IDraggableIconProps {
    size?: number;
    className?: string;
}
export const DraggableIcon: React.FC<IDraggableIconProps> = ({
    size = 20,
    className = '',
}) => (
    <Icon
        className={clsx('DraggableIcon', className)}
        name="GripVertical"
        size={size}
    />
);
