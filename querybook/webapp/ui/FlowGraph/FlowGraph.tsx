import { debounce } from 'lodash';
import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
    Edge,
    ReactFlowProvider,
    useReactFlow,
    ConnectionLineType,
    Controls,
    MiniMap,
    addEdge,
    Background,
    Connection,
    applyNodeChanges,
    applyEdgeChanges,
    NodeChange,
    EdgeChange,
    Node,
    ReactFlowInstance,
    Position,
} from 'react-flow-renderer';

import { getLayoutedElements, LayoutDirection } from './helpers';

import { Button } from 'ui/Button/Button';
import { KeyboardKey } from 'ui/KeyboardKey/KeyboardKey';
import { AccentText } from 'ui/StyledText/StyledText';
import { Icon } from 'ui/Icon/Icon';

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
    const [layoutDirection, setLayoutDirection] = React.useState<'LR' | 'TB'>();
    const targetPosition =
        layoutDirection === 'LR' ? Position.Left : Position.Top;
    const sourcePosition =
        layoutDirection === 'LR' ? Position.Right : Position.Bottom;

    React.useEffect(() => {
        if (nodes.length && !layoutDirection) {
            const direction =
                nodes[0].sourcePosition === Position.Right ? 'LR' : 'TB';
            setLayoutDirection(direction);
        }
    }, [nodes, layoutDirection]);

    const onRemoveEdge = useCallback(
        (id) => {
            setEdges((edges) => edges.filter((edge) => !(edge.id === id)));
        },
        [setEdges]
    );

    React.useEffect(() => {
        setEdges((edges) =>
            edges.map((edge) => ({ ...edge, data: { onRemove: onRemoveEdge } }))
        );
    }, [edges.length, onRemoveEdge, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => {
            setEdges((eds) =>
                addEdge(
                    {
                        ...params,
                        type: 'removableEdge',
                        data: { onRemove: onRemoveEdge },
                    },
                    eds
                )
            );
        },
        [onRemoveEdge, setEdges]
    );

    const onNodesChange = useCallback(
        (changes: NodeChange[]) =>
            setNodes((nds) => {
                const appliedNodes = applyNodeChanges(changes, nds);
                return appliedNodes.map((node) => ({
                    ...node,
                    targetPosition,
                    sourcePosition,
                }));
            }),
        [setNodes, sourcePosition, targetPosition]
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) =>
            setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );

    const onLayout = React.useCallback(
        (direction: LayoutDirection = 'LR') => {
            setLayoutDirection(direction);
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
                <div className="flex-column layout-buttons m12">
                    <div>
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
                    <div className="FlowGraph-hint flex-row mt12">
                        <div className="flex-column">
                            <div>
                                <KeyboardKey value="backspace" />
                            </div>
                            <Icon name="Maximize" size={16} />
                        </div>
                        <div className="flex-column">
                            <AccentText
                                size="xxsmall"
                                className="mh8"
                                color="light"
                            >
                                to remove node
                            </AccentText>
                            <AccentText
                                size="xxsmall"
                                className="mh8"
                                color="light"
                            >
                                to fit all nodes
                            </AccentText>
                        </div>
                    </div>
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
