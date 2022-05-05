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
    updated: boolean;
    readonly: boolean;
}

// TODO: make edge deletable
export const QueryCellNode = React.memo<IProps>(({ data }) => {
    const { label, readonly, onDelete, updated } = data;

    const QueryCellNodeClassName = clsx({
        QueryCellNode: true,
        'flex-row': true,
        updated,
    });

    return (
        <div
            className={QueryCellNodeClassName}
            aria-label={
                updated
                    ? 'Query updated. Please save progress to keep changes.'
                    : null
            }
            data-balloon-pos={'up'}
        >
            <Handle type="target" position={Position.Left} />
            <div className="QueryCellNode-label">{label}</div>
            {!readonly && (
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
