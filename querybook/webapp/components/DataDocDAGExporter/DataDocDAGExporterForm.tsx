import * as React from 'react';
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
    ) => Promise<any>;
    savedMeta: Record<string, any>;
    nodes: Node[];
    edges: Edge[];
    onSave: (
        nodes: Node[],
        edges: Edge[],
        exporterMeta?: Record<string, any>,
        useTemplatedVariables?: boolean
    ) => Promise<IDataDocDAGExport>;
    onReturn: () => void;
}

export const DataDocDAGExporterForm = ({
    handleExport,
    savedMeta,
    nodes,
    edges,

    onSave,
    onReturn,
}: IProps) => (
    <>
        <div className="DataDocDAGExporter-graph">
            <div className="DataDocDAGExporter-graph-wrapper">
                <div className="DataDocDAGExporterGraph">
                    <FlowGraph
                        nodes={nodes}
                        edges={edges}
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
                onSave={(exporterMeta, useTemplatedVariables) =>
                    onSave(nodes, edges, exporterMeta, useTemplatedVariables)
                }
            />
        </div>
    </>
);
