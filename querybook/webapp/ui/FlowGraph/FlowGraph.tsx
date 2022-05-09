import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
    Edge,
    ReactFlowProvider,
    useReactFlow,
    ConnectionLineType,
    Controls,
    MiniMap,
    Node,
    addEdge,
    Background,
    Connection,
    applyNodeChanges,
    applyEdgeChanges,
    NodeChange,
    EdgeChange,
} from 'react-flow-renderer';

import { Button } from 'ui/Button/Button';

import './FlowGraph.scss';
import { getLayoutedElements, LayoutDirection } from './helpers';

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
    autoLayout?: boolean;

    onNodesChange?: (nodes: Node[]) => void;
    onEdgesChange?: (edges: Edge[]) => void;
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
    plugins,
}) => {
    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
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
                fitView
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
            {plugins.controls && <Controls />}
        </>
    );
};
