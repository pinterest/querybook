import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Edge, Node, Position, ReactFlowInstance } from 'react-flow-renderer';
import { useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';

import { IDataQueryCell } from 'const/datadoc';
import { IStoreState } from 'redux/store/types';
import * as dataDocSelectors from 'redux/dataDoc/selector';
import { hashString } from 'lib/data-doc/data-doc-utils';

import { queryCellDraggableType } from 'components/DataDocDAGExporter/DataDocDAGExporter';

import { QueryCellNode } from 'ui/FlowGraph/QueryCellNode';
import { IDragItem } from 'ui/DraggableList/types';

export const queryCellNode = 'queryCellNode';
export const QueryDAGNodeTypes = { queryCellNode: QueryCellNode };

export function useQueryCells(docId: number) {
    const { dataDocCells } = useSelector((state: IStoreState) =>
        dataDocSelectors.dataDocSelector(state, docId)
    );

    const queryCells: IDataQueryCell[] = React.useMemo(
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
    readonly: boolean,
    graphRef: React.MutableRefObject<HTMLDivElement>
) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

    const [graphInstance, setGraphInstance] = useState<
        ReactFlowInstance<any, any>
    >();

    useEffect(() => console.log('savedEdges', savedEdges), [savedEdges]);
    useEffect(() => console.log('edges', edges), [edges]);

    const createNode = useCallback(
        (cell: IDataQueryCell, savedNode?: Partial<Node>) => ({
            id: cell.id.toString(),
            type: queryCellNode,
            data: {
                label: cell.meta?.title,
                updated:
                    savedNode?.data?.queryHash &&
                    isQueryUpdated(savedNode?.data?.queryHash, cell.context),
                query: cell.context,
            },
            position: savedNode?.position ?? initialNodePosition,
            sourcePosition: savedNode.sourcePosition ?? Position.Left,
            targetPosition: savedNode.targetPosition ?? Position.Right,
        }),
        []
    );

    useEffect(() => {
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
        const newEdges = savedEdges.filter(
            (edge) =>
                newNodesIds.has(edge.source) || newNodesIds.has(edge.target)
        );
        setNodes(newNodes);
        setEdges(newEdges);
    }, [savedNodes, savedEdges, createNode, queryCells]);

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
        canDrop: () => !readonly,
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
