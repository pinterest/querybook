import * as React from 'react';

import { useSavedDAG } from 'hooks/dag/useSavedDAG';
import { useGraphQueryCells } from 'hooks/dag/useGraphQueryCells';

import { DataDocDagExporterList } from './DataDocDAGExporterList';
import { DataDocDAGExporterGraph } from './DataDocDAGExporterGraph';

import { Button } from 'ui/Button/Button';

import './DataDocDAGExporter.scss';

interface IProps {
    docId: number;
    readonly: boolean;
}

export const queryCellDraggableType = 'QueryCell-';

export const DataDocDAGExporter: React.FunctionComponent<IProps> = ({
    docId,
    readonly,
}) => {
    const { onSave, savedNodes, savedEdges } = useSavedDAG(docId);

    const {
        deleteGraphQueryCell,
        unusedQueryCells,
        graphQueryCells,
        dropRef,
    } = useGraphQueryCells(docId, savedNodes, readonly);

    return (
        <div className="DataDocDAGExporter">
            <DataDocDagExporterList queryCells={unusedQueryCells} />
            <div className="DataDocDAGExporter-main">
                <div className="DataDocDAGExporter-graph-wrapper" ref={dropRef}>
                    <DataDocDAGExporterGraph
                        queryCells={graphQueryCells}
                        savedNodes={savedNodes}
                        savedEdges={savedEdges}
                        onDeleteCell={deleteGraphQueryCell}
                        renderSaveComponent={
                            readonly
                                ? null
                                : (nodes, edges) => (
                                      <DataDocDAGExporterSave
                                          onSave={() => onSave(nodes, edges)}
                                      />
                                  )
                        }
                        readonly={readonly}
                    />
                </div>
            </div>
        </div>
    );
};

export const DataDocDAGExporterSave: React.FunctionComponent<{
    onSave: () => void;
}> = ({ onSave }) => (
    <div className="DataDocDAGExporter-bottom flex-row mr12">
        <Button icon="Save" title="Save Progress" onClick={onSave} />
        <Button icon="FileOutput" title="Export" />
    </div>
);
