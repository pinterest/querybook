import React from 'react';
import dagre from 'dagre';
import ReactFlow, {
    Edge,
    ReactFlowProvider,
    useStoreApi,
    useReactFlow,
    useNodesState,
    useEdgesState,
    ConnectionLineType,
    Controls,
    MiniMap,
    Node,
    addEdge,
    Background,
} from 'react-flow-renderer';

import './FlowGraph.scss';

interface IProps {
    nodes: Node[];
    edges: Edge[];
    nodeTypes?: Record<string, any>;
    isInteractive?: boolean;
}
export const initialNodePosition = { x: 0, y: 0 };
export const edgeStyle = { stroke: 'var(--bg-dark)' };

const nodeWidth = 240;
const nodeHeight = 60;

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

// from react-flow docs
const getLayoutedElements = (nodes, edges) => {
    dagreGraph.setGraph({ rankdir: 'LR' });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = 'left';
        node.sourcePosition = 'right';

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes, edges };
};

export const FlowGraph: React.FunctionComponent<IProps> = ({
    isInteractive = false,
    ...graphProps
}) => (
    <div className="FlowGraph">
        <ReactFlowProvider>
            {isInteractive ? (
                <InteractiveFlowGraph {...graphProps} />
            ) : (
                <StaticFlowGraph {...graphProps} />
            )}
        </ReactFlowProvider>
    </div>
);

const StaticFlowGraph: React.FunctionComponent<IProps> = ({
    nodes: initialNodes,
    edges: initialEdges,
    nodeTypes,
}) => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = React.useMemo(
        () => getLayoutedElements(initialNodes, initialEdges),
        [initialNodes, initialEdges]
    );
    const store = useStoreApi();
    const { nodeInternals } = store.getState();
    const { fitView } = useReactFlow();

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    React.useEffect(() => {
        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
        fitView();
    }, [
        setNodes,
        layoutedNodes,
        setEdges,
        layoutedEdges,
        fitView,
        nodeInternals,
    ]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodesConnectable={false}
            nodesDraggable={false}
            connectionLineType={ConnectionLineType.Bezier}
            nodeTypes={nodeTypes}
            fitView
        >
            <Controls />
            <MiniMap />
        </ReactFlow>
    );
};

const InteractiveFlowGraph: React.FunctionComponent<IProps> = ({
    nodes: initialNodes,
    edges: initialEdges,
    nodeTypes,
}) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = (params) => setEdges((eds) => addEdge(params, eds));

    React.useEffect(() => {
        setNodes(initialNodes);
    }, [initialNodes, setNodes]);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodesConnectable={true}
            nodesDraggable={true}
            onConnect={onConnect}
            snapToGrid={true}
            connectionLineType={ConnectionLineType.Bezier}
            nodeTypes={nodeTypes}
            fitView
        >
            <MiniMap />
            <Controls />
            <Background />
        </ReactFlow>
    );
};
