import clsx from 'clsx';
import React, { useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { Handle, Position, useReactFlow } from 'reactflow';

import { IDataQueryCell } from 'const/datadoc';
import { DataDocDAGExporterContext } from 'context/DataDocDAGExporter';
import { IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { ThemedCodeHighlight } from 'ui/CodeHighlight/ThemedCodeHighlight';
import { Icon } from 'ui/Icon/Icon';
import { Modal } from 'ui/Modal/Modal';
import { AccentText, StyledText } from 'ui/StyledText/StyledText';
import { Tag } from 'ui/Tag/Tag';

import './QueryCellNode.scss';

interface IProps {
    data: IQueryCellNodeProps;
    sourcePosition: Position;
    targetPosition: Position;
    id: string;
    selected: boolean;
}

export interface IQueryCellNodeProps {
    queryCell: IDataQueryCell;
    updated: boolean;
}

// TODO: make edge deletable
export const QueryCellNode = React.memo<IProps>(
    ({ data, sourcePosition, targetPosition, id, selected }) => {
        const { isEngineSupported } = useContext(DataDocDAGExporterContext);

        const { getNode, deleteElements } = useReactFlow();
        const [showQuery, setShowQuery] = useState(false);

        const { queryCell, updated } = data;
        const {
            meta: { engine: engineId, title: label },
            context: query,
        } = queryCell;

        const queryEngine = useSelector(
            (state: IStoreState) => state.queryEngine.queryEngineById[engineId]
        );
        const engineSupported = isEngineSupported(engineId);

        const QueryCellNodeClassName = clsx({
            QueryCellNode: true,
            updated,
            selected,
        });

        const deleteNode = useCallback(() => {
            deleteElements({ nodes: [getNode(id)] });
        }, [deleteElements, getNode, id]);

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
                            size={12}
                            onClick={() => {
                                setShowQuery(true);
                            }}
                        />
                        <IconButton
                            icon="X"
                            tooltip="Remove the node"
                            size={12}
                            className="QueryCellNode-toolbar-button"
                            onClick={deleteNode}
                        />
                    </div>
                )}
                <Handle type="target" position={targetPosition} />
                <div>
                    <div className="flex-left">
                        <Tag mini light className="QueryCellNode-tag">
                            {queryEngine.name}
                        </Tag>
                        {!engineSupported && (
                            <div
                                className="flex-center"
                                aria-label="Selected exporter doesn't support this query engine"
                                data-balloon-pos="up"
                            >
                                <Icon
                                    name="AlertOctagon"
                                    size={10}
                                    color="false"
                                />
                            </div>
                        )}
                    </div>

                    <div className="QueryCellNode-label">
                        {label ? (
                            <AccentText size="small">{label}</AccentText>
                        ) : (
                            <StyledText untitled>Untitled Cell {id}</StyledText>
                        )}
                    </div>
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
