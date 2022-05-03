import * as React from 'react';
import clsx from 'clsx';
import { Handle, Position } from 'react-flow-renderer';

import { IconButton } from 'ui/Button/IconButton';

import './QueryCellNode.scss';

interface IProps {
    data: IQueryCellNodeProps;
}

export interface IQueryCellNodeProps {
    label: string;
    onDelete: () => void;
    readonly: boolean;
}

export const QueryCellNode = React.memo<IProps>(({ data }) => {
    const { label, readonly, onDelete } = data;

    const QueryCellNodeClassName = clsx('QueryCellNode', 'flex-row');

    return (
        <div className={QueryCellNodeClassName}>
            <Handle type="target" position={Position.Left} />
            <div className="QueryCellNode-label">{label}</div>
            {readonly ? null : (
                <IconButton
                    icon="X"
                    noPadding
                    onClick={onDelete}
                    className="ml4"
                    size={16}
                />
            )}
            <Handle type="source" position={Position.Right} />
        </div>
    );
});
