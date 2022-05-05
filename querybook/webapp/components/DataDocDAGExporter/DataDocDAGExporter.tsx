import * as React from 'react';

import { useSavedDAG } from 'hooks/dag/useSavedDAG';
import { useGraphQueryCells } from 'hooks/dag/useGraphQueryCells';
import { DataDocResource } from 'resource/dataDoc';

import { DataDocDagExporterList } from './DataDocDAGExporterList';
import { DataDocDAGExporterGraph } from './DataDocDAGExporterGraph';
import { DataDocDAGExporterSettings } from './DataDocDAGExporterSettings';

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
    const [isExporting, setIsExporting] = React.useState(false);
    const [exportNodes, setExportNodes] = React.useState([]);
    const [exportEdges, setExportEdges] = React.useState([]);

    const { onSave, savedNodes, savedEdges, savedMeta } = useSavedDAG(docId);

    const {
        deleteGraphQueryCell,
        unusedQueryCells,
        graphQueryCells,
        dropRef,
    } = useGraphQueryCells(docId, savedNodes, readonly);

    const handleExport = React.useCallback(
        async (exporterName, exporterSettings) => {
            const meta = { ...savedMeta, [exporterName]: exporterSettings };
            onSave(exportNodes, exportEdges, meta);

            const { data: exportData } = await DataDocResource.exportDAG(
                docId,
                exporterName,
                exportNodes,
                exportEdges,
                exporterSettings
            );
            return exportData;
        },
        [docId, exportEdges, exportNodes, onSave, savedMeta]
    );

    const graphDOM = (
        <div className="DataDocDAGExporter-graph-wrapper" ref={dropRef}>
            <DataDocDAGExporterGraph
                queryCells={graphQueryCells}
                savedNodes={savedNodes}
                savedEdges={savedEdges}
                onDeleteCell={deleteGraphQueryCell}
                renderSaveComponent={
                    readonly || isExporting
                        ? null
                        : (nodes, edges) => (
                              <DataDocDAGExporterSave
                                  onSave={() => onSave(nodes, edges)}
                                  onExport={() => {
                                      setIsExporting(true);
                                      setExportNodes(nodes);
                                      setExportEdges(edges);
                                  }}
                              />
                          )
                }
                readonly={isExporting || readonly}
            />
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
                    />
                </div>
            )}
        </div>
    );
};

export const DataDocDAGExporterSave: React.FunctionComponent<{
    onSave: () => void;
    onExport: () => void;
}> = ({ onSave, onExport }) => (
    <div className="DataDocDAGExporter-bottom flex-row right-align">
        <Button icon="Save" title="Save Progress" onClick={onSave} />
        <Button
            icon="FileOutput"
            title="Save & Export"
            onClick={() => {
                onSave();
                onExport();
            }}
        />
    </div>
);
