import * as React from 'react';
import clsx from 'clsx';
import { Handle, Position } from 'react-flow-renderer';

import './QueryCellNode.scss';

interface IProps {
    data: IQueryCellNodeProps;
    sourcePosition: Position;
    targetPosition: Position;
}

export interface IQueryCellNodeProps {
    label: string;
    updated: boolean;
}

// TODO: make edge deletable
export const QueryCellNode = React.memo<IProps>(
    ({ data, sourcePosition, targetPosition }) => {
        const { label, updated } = data;

        const QueryCellNodeClassName = clsx({
            QueryCellNode: true,
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
                <Handle type="target" position={targetPosition} />
                <div className="QueryCellNode-label">{label}</div>
                <Handle type="source" position={sourcePosition} />
            </div>
        );
    }
);
