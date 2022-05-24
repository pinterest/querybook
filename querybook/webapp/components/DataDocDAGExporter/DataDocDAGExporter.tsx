import * as React from 'react';

import { useSavedDAG } from 'hooks/dag/useSavedDAG';
import {
    useExporterDAG,
    useQueryCells,
    useUnusedQueryCells,
} from 'hooks/dag/useExporterDAG';
import { DataDocResource } from 'resource/dataDoc';

import { DataDocDAGExporterGraph } from './DataDocDAGExporterGraph';
import { DataDocDAGExporterForm } from './DataDocDAGExporterForm';
import { DataDocDagExporterList } from './DataDocDAGExporterList';

import { Button } from 'ui/Button/Button';
import { CopyPasteModal } from 'ui/CopyPasteModal/CopyPasteModal';
import { Modal } from 'ui/Modal/Modal';

import './DataDocDAGExporter.scss';

interface IProps {
    docId: number;
}

export const queryCellDraggableType = 'QueryCell-';

export const DataDocDAGExporter: React.FunctionComponent<IProps> = ({
    docId,
}) => {
    const graphRef = React.useRef();
    const [isExporting, setIsExporting] = React.useState(false);
    const [exportData, setExportData] = React.useState<string>();
    const [exportType, setExportType] = React.useState<string>();

    const { onSave, savedNodes, savedEdges, savedMeta } = useSavedDAG(docId);
    const queryCells = useQueryCells(docId);
    const [
        nodes,
        edges,
        setNodes,
        setEdges,
        dropRef,
        setGraphInstance,
    ] = useExporterDAG(queryCells, savedNodes, savedEdges, graphRef);

    const unusedQueryCells = useUnusedQueryCells(queryCells, nodes);

    const handleExport = React.useCallback(
        async (exporterName: string, exporterSettings: Record<string, any>) => {
            const meta = { ...savedMeta, [exporterName]: exporterSettings };
            await onSave(nodes, edges, meta);

            const { data: exportData } = await DataDocResource.exportDAG(
                docId,
                exporterName
            );
            setExportData(exportData?.export);
            setExportType(exportData?.type);
        },
        [docId, nodes, edges, onSave, savedMeta]
    );

    return (
        <div className="DataDocDAGExporter">
            {isExporting ? (
                <DataDocDAGExporterForm
                    handleExport={handleExport}
                    savedMeta={savedMeta}
                    nodes={nodes}
                    edges={edges}
                    onSave={onSave}
                    onReturn={() => setIsExporting(false)}
                />
            ) : (
                <>
                    <DataDocDagExporterList queryCells={unusedQueryCells} />
                    <DataDocDAGExporterGraph
                        dropRef={dropRef}
                        graphRef={graphRef}
                        setGraphInstance={setGraphInstance}
                        nodes={nodes}
                        edges={edges}
                        setNodes={setNodes}
                        setEdges={setEdges}
                        onSave={onSave}
                        onNext={() => setIsExporting(true)}
                    />
                </>
            )}
            {exportData &&
                (exportType === 'url' ? (
                    <Modal
                        onHide={() => setExportData(undefined)}
                        title="Export Data"
                    >
                        <div className="flex-center mv24">
                            <Button
                                icon="ChevronRight"
                                title="Go To Export"
                                onClick={() => window.open(exportData)}
                            />
                        </div>
                    </Modal>
                ) : (
                    <CopyPasteModal
                        text={exportData}
                        title="Export Data"
                        onHide={() => setExportData(undefined)}
                    />
                ))}
        </div>
    );
};

export const DataDocDAGExporterSave: React.FunctionComponent<{
    onSave: () => Promise<any>;
    onNext: () => void;
}> = ({ onSave, onNext }) => (
    <div className="DataDocDAGExporter-bottom flex-row right-align">
        <Button icon="Save" title="Save Progress" onClick={onSave} />
        <Button
            icon="ChevronRight"
            title="Configure Exporter"
            onClick={async () => {
                await onSave();
                onNext();
            }}
        />
    </div>
);
