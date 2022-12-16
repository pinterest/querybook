import React, { useMemo } from 'react';

import { DataDocDAGExporterContext } from 'context/DataDocDAGExporter';
import { useExporterDAG, useUnusedQueryCells } from 'hooks/dag/useExporterDAG';
import { useCurrentExporter } from 'hooks/dag/useExporterSettings';
import { useSavedDAG } from 'hooks/dag/useSavedDAG';
import { useQueryCells } from 'hooks/dataDoc/useQueryCells';
import { DataDocResource } from 'resource/dataDoc';
import { IconButton } from 'ui/Button/IconButton';
import { Markdown } from 'ui/Markdown/Markdown';
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

    const currentExporter = useCurrentExporter(docId);
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
            setExportData(exportData);
        },
        [docId, nodes, edges, onSave]
    );

    const DAGExporterContextState = useMemo(() => {
        // for the "?? true" below, we assume all the query cells
        // are supported before current exporter is loaded
        const isEngineSupported = (engineId: number) =>
            currentExporter?.engines.includes(engineId) ?? true;
        return {
            docId,
            currentExporter,
            isEngineSupported,
        };
    }, [docId, currentExporter]);

    return (
        <DataDocDAGExporterContext.Provider value={DAGExporterContextState}>
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
                        docId={docId}
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
                    {exportData && (
                        <Modal
                            onHide={() => {
                                // Prevent modal from being closed unless explicitly click the "Close" button
                            }}
                            title="DAG Export"
                            topDOM={
                                <IconButton
                                    icon="X"
                                    onClick={() => setExportData(undefined)}
                                />
                            }
                        >
                            <Markdown>{exportData}</Markdown>
                        </Modal>
                    )}
                </div>
            </div>
        </DataDocDAGExporterContext.Provider>
    );
};
