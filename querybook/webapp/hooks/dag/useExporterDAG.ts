import {
    MutableRefObject,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useDrop } from 'react-dnd';
import { Edge, Node, Position, ReactFlowInstance } from 'react-flow-renderer';
import { useSelector } from 'react-redux';

import { queryCellDraggableType } from 'components/DataDocDAGExporter/DataDocDAGExporter';
import { IDataQueryCell } from 'const/datadoc';
import { usePrevious } from 'hooks/usePrevious';
import { hashString } from 'lib/data-doc/data-doc-utils';
import * as dataDocSelectors from 'redux/dataDoc/selector';
import { IStoreState } from 'redux/store/types';
import { IDragItem } from 'ui/DraggableList/types';
import { QueryCellNode } from 'ui/FlowGraph/QueryCellNode';

export const queryCellNode = 'queryCellNode';
export const QueryDAGNodeTypes = { queryCellNode: QueryCellNode };

export function useQueryCells(docId: number) {
    const { dataDocCells } = useSelector((state: IStoreState) =>
        dataDocSelectors.dataDocSelector(state, docId)
    );

    const queryCells: IDataQueryCell[] = useMemo(
        () =>
            dataDocCells.filter(
                (cells) => cells.cell_type === 'query'
            ) as IDataQueryCell[],
        [dataDocCells]
    );

    return queryCells;
}

export const initialNodePosition = { x: 0, y: 0 };
export const edgeStyle = { stroke: 'var(--bg-dark)' };

const isQueryUpdated = (savedHash: number, query: string) => {
    const hash = hashString(query);
    return !(hash === savedHash);
};

export function useExporterDAG(
    queryCells: IDataQueryCell[],
    savedNodes: Node[],
    savedEdges: Edge[],
    graphRef: MutableRefObject<HTMLDivElement>
) {
    const [appliedSaved, setAppliedSaved] = useState<boolean>(false);

    const [nodes, setNodes] = useState<Node[]>([]);
    const prevNodeLength = usePrevious(nodes.length);

    const [edges, setEdges] = useState<Edge[]>([]);
    const prevEdgeLength = usePrevious(edges.length);

    const [layoutDirection, setLayoutDirection] = useState<'LR' | 'TB'>();
    const targetPosition =
        layoutDirection === 'LR' ? Position.Left : Position.Top;
    const sourcePosition =
        layoutDirection === 'LR' ? Position.Right : Position.Bottom;

    const [graphInstance, setGraphInstance] =
        useState<ReactFlowInstance<any, any>>();

    const createNode = useCallback(
        (cell: IDataQueryCell, savedNode?: Partial<Node>) => ({
            id: cell.id.toString(),
            type: queryCellNode,
            data: {
                queryCell: cell,
                updated:
                    savedNode?.data?.queryHash &&
                    isQueryUpdated(savedNode?.data?.queryHash, cell.context),
            },
            position: savedNode?.position ?? initialNodePosition,
            sourcePosition: savedNode.sourcePosition ?? sourcePosition,
            targetPosition: savedNode.targetPosition ?? targetPosition,
        }),
        [sourcePosition, targetPosition]
    );

    const onRemoveEdge = useCallback(
        (id) => {
            setEdges((edges) => edges.filter((edge) => !(edge.id === id)));
        },
        [setEdges]
    );

    const removableEdgeProps = useMemo(
        () => ({
            type: 'removableEdge',
            data: { onRemove: onRemoveEdge },
        }),
        [onRemoveEdge]
    );

    useEffect(() => {
        if (nodes.length) {
            const direction =
                nodes[0].targetPosition === Position.Left ? 'LR' : 'TB';
            setLayoutDirection(direction);
        }
    }, [nodes]);

    useEffect(() => {
        if (nodes.length > prevNodeLength) {
            setNodes((nodes) =>
                nodes.map((node) => ({
                    ...node,
                    sourcePosition,
                    targetPosition,
                }))
            );
        }
    }, [nodes, prevNodeLength, sourcePosition, targetPosition]);

    useEffect(() => {
        if (edges.length > prevEdgeLength) {
            setEdges((edges) =>
                edges.map((edge) => ({
                    ...edge,
                    ...removableEdgeProps,
                }))
            );
        }
    }, [edges.length, prevEdgeLength, removableEdgeProps]);

    useEffect(() => setAppliedSaved(false), [savedNodes, savedEdges]);

    useEffect(() => {
        if (appliedSaved) {
            return;
        }
        const newNodes = savedNodes
            .map((savedNode) => {
                const queryCell = queryCells.find(
                    (cell) => cell.id.toString() === savedNode.id
                );
                if (!queryCell) {
                    return null;
                }

                return createNode(queryCell, savedNode);
            })
            .filter((n) => n);
        const newNodesIds = new Set(newNodes.map((node) => node.id));
        const newEdges = savedEdges
            .filter(
                (edge) =>
                    newNodesIds.has(edge.source) || newNodesIds.has(edge.target)
            )
            .map((edge) => ({
                ...edge,
                ...removableEdgeProps,
            }));
        setNodes(newNodes);
        setEdges(newEdges);
        setAppliedSaved(true);
    }, [
        savedNodes,
        savedEdges,
        createNode,
        queryCells,
        removableEdgeProps,
        appliedSaved,
    ]);

    const [, dropRef] = useDrop({
        accept: [queryCellDraggableType],
        drop: (item: IDragItem<IDataQueryCell>, monitor) => {
            if (monitor.didDrop()) {
                return;
            }
            const reactFlowBounds = graphRef.current.getBoundingClientRect();

            const position =
                graphInstance &&
                graphInstance.project({
                    x: monitor.getClientOffset().x - reactFlowBounds.left,
                    y: monitor.getClientOffset().y - reactFlowBounds.top,
                });

            setNodes((nodes) =>
                nodes.concat([
                    createNode(
                        item.itemInfo,
                        position ? { position } : undefined
                    ),
                ])
            );
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    return [
        nodes,
        edges,
        setNodes,
        setEdges,
        dropRef,
        setGraphInstance,
    ] as const;
}

export function useUnusedQueryCells(
    queryCells: IDataQueryCell[],
    nodes: Node[]
) {
    return useMemo(() => {
        const nodeIds = new Set(nodes.map((node) => node.id));
        return queryCells.filter((cell) => !nodeIds.has(cell.id.toString()));
    }, [nodes, queryCells]);
}
