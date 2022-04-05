import * as React from 'react';
import clsx from 'clsx';
import { Handle, Position } from 'react-flow-renderer';

import { IconButton } from 'ui/Button/IconButton';

import './LineageNode.scss';

interface IProps {
    data: ILineageNodeProps;
}

export interface ILineageNodeProps {
    label: string;
    onSelect: (id) => void;
    onExpand: (id) => void;
    isSelected: boolean;
}

export default React.memo<IProps>(({ data }) => {
    const { label, onExpand, onSelect, isSelected } = data;

    const LineageNodeClassName = clsx({
        LineageNode: true,
        'flex-row': true,
        selected: isSelected,
    });
    return (
        <div className={LineageNodeClassName}>
            <Handle type="target" position={Position.Left} />
            <div className="LineageNode-label" onClick={onSelect}>
                {label}
            </div>
            <IconButton
                icon="Eye"
                className="ml8"
                noPadding
                size={16}
                onClick={onExpand}
            />
            <Handle type="source" position={Position.Right} />
        </div>
    );
});
