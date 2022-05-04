import * as React from 'react';

import { useSavedDAG } from 'hooks/dag/useSavedDAG';
import { useGraphQueryCells } from 'hooks/dag/useGraphQueryCells';

import { DataDocDagExporterList } from './DataDocDAGExporterList';
import { DataDocDAGExporterGraph } from './DataDocDAGExporterGraph';
import { DataDocDAGExporterSettings } from './DataDocDAGExporterSettings';

import { Button } from 'ui/Button/Button';

import './DataDocDAGExporter.scss';
import { useDispatch } from 'react-redux';
import { exportDAG } from 'redux/dataDoc/action';

interface IProps {
    docId: number;
    readonly: boolean;
}

export const queryCellDraggableType = 'QueryCell-';

export const DataDocDAGExporter: React.FunctionComponent<IProps> = ({
    docId,
    readonly,
}) => {
    const dispatch = useDispatch();
    const [isExporting, setIsExporting] = React.useState(false);
    const [exportNodes, setExportNodes] = React.useState([]);
    const [exportEdges, setExportEdges] = React.useState([]);

    const { onSave, savedNodes, savedEdges } = useSavedDAG(docId);

    const {
        deleteGraphQueryCell,
        unusedQueryCells,
        graphQueryCells,
        dropRef,
    } = useGraphQueryCells(docId, savedNodes, readonly);

    const handleExport = React.useCallback(
        (exporterName, exporterSettings) => {
            dispatch(
                exportDAG(
                    docId,
                    exporterName,
                    exportNodes,
                    exportEdges,
                    exporterSettings
                )
            );
        },
        [dispatch, docId, exportEdges, exportNodes]
    );

    const graphDOM = (
        <div
            className={
                isExporting
                    ? 'DataDocDAGExporter-graph'
                    : 'DataDocDAGExporter-main'
            }
        >
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
        </div>
    );

    return (
        <div className="DataDocDAGExporter">
            {!isExporting && (
                <DataDocDagExporterList queryCells={unusedQueryCells} />
            )}
            {graphDOM}
            {isExporting && (
                <div className="DataDocDAGExporter-main">
                    <DataDocDAGExporterSettings
                        onCancel={() => setIsExporting(false)}
                        onExport={handleExport}
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
    <div className="DataDocDAGExporter-bottom flex-row mr12">
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
