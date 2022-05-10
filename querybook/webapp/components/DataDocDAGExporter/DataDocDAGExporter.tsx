import * as React from 'react';

import { useSavedDAG } from 'hooks/dag/useSavedDAG';
import {
    QueryDAGNodeTypes,
    useExporterDAG,
    useQueryCells,
    useUnusedQueryCells,
} from 'hooks/dag/useExporterDAG';
import { DataDocResource } from 'resource/dataDoc';

import { DataDocDagExporterList } from './DataDocDAGExporterList';
import { DataDocDAGExporterSettings } from './DataDocDAGExporterSettings';
import { Button } from 'ui/Button/Button';
import { FlowGraph } from 'ui/FlowGraph/FlowGraph';

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
    const [isExporting, setIsExporting] = React.useState(false);
    const isInteractive = !(readonly || isExporting);

    const { onSave, savedNodes, savedEdges, savedMeta } = useSavedDAG(docId);
    const queryCells = useQueryCells(docId);
    const [nodes, edges, setNodes, setEdges, dropRef] = useExporterDAG(
        queryCells,
        savedNodes,
        savedEdges,
        !isInteractive
    );
    const unusedQueryCells = useUnusedQueryCells(queryCells, nodes);

    const handleExport = React.useCallback(
        async (exporterName, exporterSettings) => {
            const meta = { ...savedMeta, [exporterName]: exporterSettings };
            await onSave(nodes, edges, meta);

            const { data: exportData } = await DataDocResource.exportDAG(
                docId,
                exporterName,
                nodes,
                edges,
                exporterSettings
            );
            return exportData;
        },
        [docId, nodes, edges, onSave, savedMeta]
    );

    const graphDOM = (
        <div className="DataDocDAGExporter-graph-wrapper" ref={dropRef}>
            <div className="DataDocDAGExporterGraph">
                <FlowGraph
                    isInteractive={isInteractive}
                    nodes={nodes}
                    edges={edges}
                    setNodes={setNodes}
                    setEdges={setEdges}
                    nodeTypes={QueryDAGNodeTypes}
                />
            </div>
            {isInteractive && (
                <DataDocDAGExporterSave
                    onSave={() => onSave(nodes, edges)}
                    onExport={async () => {
                        setIsExporting(true);
                    }}
                />
            )}
        </div>
    );

    return (
        <div className="DataDocDAGExporter">
            {!isExporting && (
                <DataDocDagExporterList queryCells={unusedQueryCells} />
            )}
            <div
                className={
                    isExporting
                        ? 'DataDocDAGExporter-graph'
                        : 'DataDocDAGExporter-main'
                }
            >
                {graphDOM}
                {isExporting && (
                    <div className="DataDocDAGExporter-bottom flex-row">
                        <Button
                            icon="ChevronLeft"
                            title="Return to Graph"
                            onClick={() => setIsExporting(false)}
                            className="mr12"
                        />
                    </div>
                )}
            </div>
            {isExporting && (
                <div className="DataDocDAGExporter-main">
                    <DataDocDAGExporterSettings
                        onExport={handleExport}
                        savedMeta={savedMeta}
                        onSave={(meta) => onSave(nodes, edges, meta)}
                    />
                </div>
            )}
        </div>
    );
};

export const DataDocDAGExporterSave: React.FunctionComponent<{
    onSave: () => Promise<any>;
    onExport: () => void;
}> = ({ onSave, onExport }) => (
    <div className="DataDocDAGExporter-bottom flex-row right-align">
        <Button icon="Save" title="Save Progress" onClick={onSave} />
        <Button
            icon="ChevronRight"
            title="Configure Exporter"
            onClick={async () => {
                await onSave();
                onExport();
            }}
        />
    </div>
);
