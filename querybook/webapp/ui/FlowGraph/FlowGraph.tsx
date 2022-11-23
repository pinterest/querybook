import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
    addEdge,
    applyEdgeChanges,
    applyNodeChanges,
    Background,
    Connection,
    ConnectionLineType,
    Edge,
    EdgeChange,
    MarkerType,
    MiniMap,
    Node,
    NodeChange,
    ReactFlowInstance,
    ReactFlowProvider,
    useReactFlow,
} from 'reactflow';

import 'reactflow/dist/style.css';

import { GraphControls } from './GraphControls';
import {
    getLayoutedElements,
    LayoutDirection,
    MAX_ZOOM_LEVEL,
} from './helpers';

import './FlowGraph.scss';

interface IPluginProps {
    plugins?: {
        background?: boolean;
        controls?: boolean;
        miniMap?: boolean;
    };
}
interface IGraphProps extends IPluginProps {
    nodes: Node[];
    edges: Edge[];
    setNodes?: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges?: React.Dispatch<React.SetStateAction<Edge[]>>;

    nodeTypes?: Record<string, any>;
    edgeTypes?: Record<string, any>;
    autoLayout?: boolean;

    onNodesChange?: (nodes: Node[]) => void;
    onEdgesChange?: (edges: Edge[]) => void;

    setGraphInstance?: (graphIntstance: ReactFlowInstance<any, any>) => void;
}

interface IFlowGraphProps extends IGraphProps {
    isInteractive?: boolean;
}

export const initialNodePosition = { x: 0, y: 0 };
export const edgeStyle = { stroke: 'var(--bg-dark)' };

export const FlowGraph: React.FunctionComponent<IFlowGraphProps> = ({
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

function useLayoutDAG(nodes: Node[], edges: Edge[], disabled: boolean) {
    return React.useMemo(
        () => (disabled ? { nodes, edges } : getLayoutedElements(nodes, edges)),
        [nodes, edges, disabled]
    );
}

/**
 * Automatically call fit view when nodes/edges change
 */
function useAutoFitView(...memo: any[]) {
    const { fitView } = useReactFlow();
    const debouncedFitView = useMemo(() => debounce(fitView, 100), [fitView]);

    useEffect(() => {
        debouncedFitView();
    }, memo);
}

const StaticFlowGraph: React.FunctionComponent<IGraphProps> = ({
    nodes: initialNodes,
    edges: initialEdges,
    nodeTypes,
    autoLayout,
    plugins,
}) => {
    const { nodes, edges } = useLayoutDAG(
        initialNodes,
        initialEdges,
        !autoLayout
    );

    useAutoFitView(nodes, edges);
    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodesConnectable={false}
            nodesDraggable={false}
            connectionLineType={ConnectionLineType.Bezier}
            nodeTypes={nodeTypes}
            fitView
        >
            <ReactFlowPlugins plugins={plugins} />
        </ReactFlow>
    );
};

const defaultInteractiveFlowEdgeOptions = { animated: true };

const InteractiveFlowGraph: React.FunctionComponent<IGraphProps> = ({
    nodes,
    edges,
    setNodes,
    setEdges,

    nodeTypes,
    edgeTypes,
    plugins,
    setGraphInstance,
}) => {
    const onConnect = useCallback(
        (params: Connection) => {
            setEdges((eds) =>
                addEdge(
                    { ...params, markerEnd: { type: MarkerType.ArrowClosed } },
                    eds
                )
            );
        },
        [setEdges]
    );

    const onNodesChange = useCallback(
        (changes: NodeChange[]) =>
            setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes]
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) =>
            setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );

    const onLayout = React.useCallback(
        (direction: LayoutDirection = 'LR') => {
            const layoutedDAG = getLayoutedElements(nodes, edges, direction);
            setNodes([...layoutedDAG.nodes]);
            setEdges([...layoutedDAG.edges]);
        },
        [edges, nodes, setNodes, setEdges]
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
                defaultEdgeOptions={defaultInteractiveFlowEdgeOptions}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onInit={setGraphInstance}
                fitView
                maxZoom={MAX_ZOOM_LEVEL}
            >
                <ReactFlowPlugins
                    plugins={
                        plugins ?? {
                            background: true,
                            controls: true,
                            miniMap: true,
                        }
                    }
                />
            </ReactFlow>
        </>
    );
};

const ReactFlowPlugins: React.FC<IPluginProps> = ({ plugins }) => {
    plugins = plugins ?? {
        miniMap: true,
        controls: true,
    };

    return (
        <>
            {plugins.miniMap && <MiniMap />}
            {plugins.background && <Background />}
            {plugins.controls && <GraphControls />}
        </>
    );
};
