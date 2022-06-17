import clsx from 'clsx';
import * as React from 'react';
import { Handle, Position } from 'react-flow-renderer';

import { AccentText, StyledText } from 'ui/StyledText/StyledText';

import './QueryCellNode.scss';

interface IProps {
    data: IQueryCellNodeProps;
    sourcePosition: Position;
    targetPosition: Position;
    id: string;
}

export interface IQueryCellNodeProps {
    label: string;
    updated: boolean;
}

// TODO: make edge deletable
export const QueryCellNode = React.memo<IProps>(
    ({ data, sourcePosition, targetPosition, id }) => {
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
                <div className="QueryCellNode-label">
                    {label ? (
                        <AccentText>{label}</AccentText>
                    ) : (
                        <StyledText untitled>Untitled Cell {id}</StyledText>
                    )}
                </div>
                <Handle type="source" position={sourcePosition} />
            </div>
        );
    }
);
