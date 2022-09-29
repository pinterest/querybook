import clsx from 'clsx';
import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from 'react-flow-renderer';

import { IconButton } from 'ui/Button/IconButton';
import { ThemedCodeHighlight } from 'ui/CodeHighlight/ThemedCodeHighlight';
import { Modal } from 'ui/Modal/Modal';
import { AccentText, StyledText } from 'ui/StyledText/StyledText';

import './QueryCellNode.scss';

interface IProps {
    data: IQueryCellNodeProps;
    sourcePosition: Position;
    targetPosition: Position;
    id: string;
    selected: boolean;
}

export interface IQueryCellNodeProps {
    label: string;
    query: string;
    updated: boolean;
}

// TODO: make edge deletable
export const QueryCellNode = React.memo<IProps>(
    ({ data, sourcePosition, targetPosition, id, selected }) => {
        const { setNodes } = useReactFlow();
        const [showQuery, setShowQuery] = useState(false);
        const { label, query, updated } = data;

        const QueryCellNodeClassName = clsx({
            QueryCellNode: true,
            updated,
            selected,
        });

        const deleteNodeById = () => {
            setNodes((nds) => nds.filter((node) => node.id !== id));
        };

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
                {selected && (
                    <div className="QueryCellNode-toolbar">
                        <IconButton
                            icon="Code"
                            tooltip="View the query"
                            size={10}
                            onClick={() => {
                                setShowQuery(true);
                            }}
                        />
                        <IconButton
                            icon="X"
                            tooltip="Remove the node"
                            size={10}
                            className="QueryCellNode-toolbar-button"
                            onClick={deleteNodeById}
                        />
                    </div>
                )}
                <Handle type="target" position={targetPosition} />
                <div className="QueryCellNode-label">
                    {label ? (
                        <AccentText size="small">{label}</AccentText>
                    ) : (
                        <StyledText untitled>Untitled Cell {id}</StyledText>
                    )}
                </div>
                <Handle type="source" position={sourcePosition} />
                {showQuery && (
                    <Modal onHide={() => setShowQuery(false)}>
                        <ThemedCodeHighlight value={query} />
                    </Modal>
                )}
            </div>
        );
    }
);
