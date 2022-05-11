import * as React from 'react';
import { ConnectDropTarget } from 'react-dnd';
import { Edge, Node } from 'react-flow-renderer';

import { QueryDAGNodeTypes } from 'hooks/dag/useExporterDAG';
import { IDataDocDAGExport } from 'const/datadoc';

import { DataDocDAGExporterSettings } from './DataDocDAGExporterSettings';

import { Button } from 'ui/Button/Button';
import { FlowGraph } from 'ui/FlowGraph/FlowGraph';

interface IProps {
    handleExport: (
        exporterName: string,
        exporterSettings: Record<string, any>
    ) => Promise<string>;
    savedMeta: Record<string, any>;
    dropRef: ConnectDropTarget;
    nodes: Node[];
    edges: Edge[];
    setNodes: (value: React.SetStateAction<Node[]>) => void;
    setEdges: (value: React.SetStateAction<Edge[]>) => void;
    onSave: (
        nodes: Node[],
        edges: Edge[],
        meta?: Record<string, any>
    ) => Promise<IDataDocDAGExport>;
    onReturn: () => void;
    clearExportData: () => void;
    exportData?: string;
}

export const DataDocDAGExporterForm = ({
    handleExport,
    savedMeta,
    dropRef,
    nodes,
    edges,
    setNodes,
    setEdges,
    onSave,
    onReturn,
    clearExportData,
    exportData,
}: IProps) => (
    <>
        <div className="DataDocDAGExporter-graph">
            <div className="DataDocDAGExporter-graph-wrapper" ref={dropRef}>
                <div className="DataDocDAGExporterGraph">
                    <FlowGraph
                        nodes={nodes}
                        edges={edges}
                        setNodes={setNodes}
                        setEdges={setEdges}
                        nodeTypes={QueryDAGNodeTypes}
                    />
                </div>
            </div>
            <div className="DataDocDAGExporter-bottom flex-row">
                <Button
                    icon="ChevronLeft"
                    title="Return to Graph"
                    onClick={onReturn}
                    className="mr12"
                />
            </div>
        </div>
        <div className="DataDocDAGExporter-main">
            <DataDocDAGExporterSettings
                onExport={handleExport}
                savedMeta={savedMeta}
                onSave={(meta) => onSave(nodes, edges, meta)}
                clearExportData={clearExportData}
                exportData={exportData}
            />
        </div>
    </>
);
