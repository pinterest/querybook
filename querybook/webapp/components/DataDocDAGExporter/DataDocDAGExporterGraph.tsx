import * as React from 'react';
import { ConnectDropTarget } from 'react-dnd';
import { Edge, Node, ReactFlowInstance } from 'react-flow-renderer';

import { IDataDocDAGExport } from 'const/datadoc';
import { QueryDAGNodeTypes } from 'hooks/dag/useExporterDAG';
import { FlowGraph } from 'ui/FlowGraph/FlowGraph';
import { RemovableEdge } from 'ui/FlowGraph/RemovableEdge';

import { DataDocDAGExporterSave } from './DataDocDAGExporter';

const edgeTypes = {
    removableEdge: RemovableEdge,
};

interface IProps {
    dropRef: ConnectDropTarget;
    graphRef: React.MutableRefObject<HTMLDivElement>;
    nodes: Node[];
    edges: Edge[];
    setNodes: (value: React.SetStateAction<Node[]>) => void;
    setEdges: (value: React.SetStateAction<Edge[]>) => void;
    setGraphInstance: (graphIntstance: ReactFlowInstance<any, any>) => void;
    onSave: (nodes: Node[], edges: Edge[]) => Promise<IDataDocDAGExport>;
    onNext: () => void;
}

export const DataDocDAGExporterGraph = ({
    dropRef,
    graphRef,
    nodes,
    edges,
    setNodes,
    setEdges,
    setGraphInstance,
    onSave,
    onNext,
}: IProps) => (
    <div className="DataDocDAGExporter-main">
        <div className="DataDocDAGExporter-graph-wrapper" ref={dropRef}>
            <div className="DataDocDAGExporterGraph" ref={graphRef}>
                <FlowGraph
                    isInteractive={true}
                    nodes={nodes}
                    edges={edges}
                    setNodes={setNodes}
                    setEdges={setEdges}
                    nodeTypes={QueryDAGNodeTypes}
                    edgeTypes={edgeTypes}
                    setGraphInstance={setGraphInstance}
                />
            </div>
            <DataDocDAGExporterSave
                onSave={() => onSave(nodes, edges)}
                onNext={onNext}
            />
        </div>
    </div>
);
