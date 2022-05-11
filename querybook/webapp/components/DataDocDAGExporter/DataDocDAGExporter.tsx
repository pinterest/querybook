import * as React from 'react';

import { useSavedDAG } from 'hooks/dag/useSavedDAG';
import {
    useExporterDAG,
    useQueryCells,
    useUnusedQueryCells,
} from 'hooks/dag/useExporterDAG';

import { DataDocDAGExporterGraph } from './DataDocDAGExporterGraph';
import { DataDocDAGExporterForm } from './DataDocDAGExporterForm';
import { Button } from 'ui/Button/Button';

import './DataDocDAGExporter.scss';
import { DataDocResource } from 'resource/dataDoc';

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
    const [exportData, setExportData] = React.useState<string>();
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
        async (exporterName: string, exporterSettings: Record<string, any>) => {
            const meta = { ...savedMeta, [exporterName]: exporterSettings };
            await onSave(nodes, edges, meta);

            const { data: exportData } = await DataDocResource.exportDAG(
                docId,
                exporterName,
                nodes,
                edges,
                exporterSettings
            );
            setExportData(exportData);
            return exportData;
        },
        [docId, nodes, edges, onSave, savedMeta]
    );

    return (
        <div className="DataDocDAGExporter">
            {isExporting ? (
                <DataDocDAGExporterForm
                    handleExport={handleExport}
                    savedMeta={savedMeta}
                    dropRef={dropRef}
                    nodes={nodes}
                    edges={edges}
                    setNodes={setNodes}
                    setEdges={setEdges}
                    onSave={onSave}
                    onReturn={() => setIsExporting(false)}
                    clearExportData={() => setExportData(undefined)}
                    exportData={exportData}
                />
            ) : (
                <DataDocDAGExporterGraph
                    unusedQueryCells={unusedQueryCells}
                    dropRef={dropRef}
                    nodes={nodes}
                    edges={edges}
                    setNodes={setNodes}
                    setEdges={setEdges}
                    onSave={onSave}
                    onExport={async () => {
                        setIsExporting(true);
                    }}
                />
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
