import * as React from 'react';

import {
    useExporterDAG,
    useQueryCells,
    useUnusedQueryCells,
} from 'hooks/dag/useExporterDAG';
import { useSavedDAG } from 'hooks/dag/useSavedDAG';
import { DataDocResource } from 'resource/dataDoc';
import { Button } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { CopyPasteModal } from 'ui/CopyPasteModal/CopyPasteModal';
import { Modal } from 'ui/Modal/Modal';
import { AccentText } from 'ui/StyledText/StyledText';

import { DataDocDAGExporterGraph } from './DataDocDAGExporterGraph';
import { DataDocDagExporterList } from './DataDocDAGExporterList';
import { DataDocDAGExporterSettings } from './DataDocDAGExporterSettings';

import './DataDocDAGExporter.scss';

interface IProps {
    docId: number;
    onClose: () => void;
}

export const queryCellDraggableType = 'QueryCell-';

export const DataDocDAGExporter: React.FunctionComponent<IProps> = ({
    docId,
    onClose,
}) => {
    const graphRef = React.useRef();
    const [exportData, setExportData] = React.useState<string>();
    const [exportType, setExportType] = React.useState<string>();

    const { onSave, savedNodes, savedEdges, savedMeta } = useSavedDAG(docId);
    const queryCells = useQueryCells(docId);
    const [nodes, edges, setNodes, setEdges, dropRef, setGraphInstance] =
        useExporterDAG(queryCells, savedNodes, savedEdges, graphRef);

    const unusedQueryCells = useUnusedQueryCells(queryCells, nodes);

    const handleExport = React.useCallback(
        async (exporterName: string, exporterSettings: Record<string, any>) => {
            const meta = { [exporterName]: exporterSettings };
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
            <div className="DataDocDAGExporter-header">
                <AccentText size="large" weight="bold" color="dark">
                    DAG Exporter
                </AccentText>
                <IconButton
                    aria-label="close"
                    icon="X"
                    onClick={onClose}
                    noPadding
                />
            </div>
            <div className="DataDocDAGExporter-body">
                <DataDocDagExporterList queryCells={unusedQueryCells} />
                <DataDocDAGExporterGraph
                    dropRef={dropRef}
                    graphRef={graphRef}
                    setGraphInstance={setGraphInstance}
                    nodes={nodes}
                    edges={edges}
                    setNodes={setNodes}
                    setEdges={setEdges}
                />
                <DataDocDAGExporterSettings
                    onExport={handleExport}
                    savedMeta={savedMeta}
                    onSave={(exporterMeta, useTemplatedVariables) =>
                        onSave(
                            nodes,
                            edges,
                            exporterMeta,
                            useTemplatedVariables
                        )
                    }
                />
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
        </div>
    );
};
