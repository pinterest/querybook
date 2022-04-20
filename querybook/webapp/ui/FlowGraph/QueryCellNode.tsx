import * as React from 'react';
import clsx from 'clsx';
import { Handle, Position } from 'react-flow-renderer';

import './QueryCellNode.scss';

interface IProps {
    data: IQueryCellNodeProps;
}

export interface IQueryCellNodeProps {
    label: string;
    // onSelect: () => void;
    // onExpand: () => void;
    isSelected: boolean;
}

export const QueryCellNode = React.memo<IProps>(({ data }) => {
    const { label, isSelected } = data;

    const QueryCellNodeClassName = clsx({
        QueryCellNode: true,
        'flex-row': true,
        selected: isSelected,
    });
    return (
        <div className={QueryCellNodeClassName}>
            <Handle type="target" position={Position.Left} />
            <div className="QueryCellNode-label">{label}</div>
            <Handle type="source" position={Position.Right} />
        </div>
    );
});
