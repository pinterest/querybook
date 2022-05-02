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
import { Button } from 'ui/Button/Button';

import './FlowGraph.scss';

interface IProps {
    nodes: Node[];
    edges: Edge[];
    nodeTypes?: Record<string, any>;
    isInteractive?: boolean;
    renderSaveComponent?: (nodes: Node[], edges: Edge[]) => React.ReactElement;
}
export const initialNodePosition = { x: 0, y: 0 };
export const edgeStyle = { stroke: 'var(--bg-dark)' };

const nodeWidth = 240;
const nodeHeight = 60;

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

type LayoutDirection = 'LR' | 'TB';
const getLayoutedElements = (
    nodes,
    edges,
    direction: LayoutDirection = 'LR'
) => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? 'left' : 'top';
        node.sourcePosition = isHorizontal ? 'right' : 'bottom';

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
    renderSaveComponent,
}) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = React.useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    React.useEffect(() => {
        setNodes((existingNodes) =>
            initialNodes.map(
                (initialNode) =>
                    existingNodes.find(
                        (existingNode) => existingNode.id === initialNode.id
                    ) ?? initialNode
            )
        );
    }, [initialNodes, setNodes]);

    React.useEffect(() => {
        setEdges(initialEdges);
    }, [initialEdges, setEdges]);

    React.useEffect(() => {
        setEdges(edges.map((edge) => ({ ...edge, animated: true })));
    }, [edges.length, setEdges]);

    const onLayout = React.useCallback(
        (direction: LayoutDirection = 'LR') => {
            getLayoutedElements(nodes, edges, direction);
            // force graph to update position
            onNodesChange([{ id: '0', type: 'select', selected: true }]);
        },
        [edges, nodes, onNodesChange]
    );

    return (
        <>
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
                <div className="flex-row layout-buttons m12">
                    <Button
                        title="Vertical Layout"
                        icon="AlignCenterVertical"
                        onClick={() => onLayout('TB')}
                    />
                    <Button
                        title="Horizontal Layout"
                        icon="AlignCenterHorizontal"
                        onClick={() => onLayout('LR')}
                    />
                </div>
            </ReactFlow>
            {renderSaveComponent(nodes, edges)}
        </>
    );
};
