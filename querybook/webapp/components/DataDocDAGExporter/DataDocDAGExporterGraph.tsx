import * as React from 'react';
import { ConnectDropTarget } from 'react-dnd';
import { Edge, Node, ReactFlowInstance } from 'reactflow';

import { QueryDAGNodeTypes } from 'hooks/dag/useExporterDAG';
import { FlowGraph } from 'ui/FlowGraph/FlowGraph';
import { RemovableEdge } from 'ui/FlowGraph/RemovableEdge';

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
}

export const DataDocDAGExporterGraph = ({
    dropRef,
    graphRef,
    nodes,
    edges,
    setNodes,
    setEdges,
    setGraphInstance,
}: IProps) => (
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
    </div>
);
