import * as React from 'react';
import clsx from 'clsx';
import { Handle, Position } from 'react-flow-renderer';

import './QueryCellNode.scss';
import { IconButton } from 'ui/Button/IconButton';

interface IProps {
    data: IQueryCellNodeProps;
}

export interface IQueryCellNodeProps {
    label: string;
    onDelete: () => void;
    isSelected: boolean;
}

export const QueryCellNode = React.memo<IProps>(({ data }) => {
    const { label, isSelected, onDelete } = data;

    const QueryCellNodeClassName = clsx({
        QueryCellNode: true,
        'flex-row': true,
        selected: isSelected,
    });
    return (
        <div className={QueryCellNodeClassName}>
            <Handle type="target" position={Position.Left} />
            <div className="QueryCellNode-label">{label}</div>
            <IconButton
                icon="X"
                noPadding
                onClick={onDelete}
                className="ml4"
                size={16}
            />
            <Handle type="source" position={Position.Right} />
        </div>
    );
});
