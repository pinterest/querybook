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
    onSelect: () => void;
    onExpand: () => void;
    isSelected: boolean;
}

export const LineageNode = React.memo<IProps>(({ data }) => {
    const { label, onExpand, onSelect, isSelected } = data;

    const LineageNodeClassName = clsx({
        LineageNode: true,
        'flex-row': true,
        selected: isSelected,
    });
    return (
        <div className={LineageNodeClassName}>
            <Handle
                type="target"
                position={Position.Left}
                isConnectable={false}
            />
            <div className="LineageNode-label" onClick={onSelect}>
                {label}
            </div>
            <IconButton
                icon="Expand"
                className="ml8"
                noPadding
                size={16}
                onClick={onExpand}
                tooltip="Fetch lineage if possible"
                tooltipPos="right"
            />
            <Handle
                type="source"
                position={Position.Right}
                isConnectable={false}
            />
        </div>
    );
});
