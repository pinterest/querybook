import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';

import { IDataQueryCell } from 'const/datadoc';
import { IStoreState } from 'redux/store/types';
import * as dataDocSelectors from 'redux/dataDoc/selector';

import { queryCellDraggableType } from 'components/DataDocDAGExporter/DataDocDAGExporter';
import { IDragItem } from 'ui/DraggableList/types';
import { Edge, Node } from 'react-flow-renderer';

import { QueryCellNode } from 'ui/FlowGraph/QueryCellNode';

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

export function useExporterDAG(
    queryCells: IDataQueryCell[],
    savedNodes: Node[],
    savedEdges: Edge[],
    readonly: boolean
) {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

    const handleDeleteNode = React.useCallback((id: string) => {
        setNodes((nodes) => nodes.filter((node) => node.id !== id));
        setEdges((edges) =>
            edges.filter((edge) => edge.source !== id && edge.target !== id)
        );
    }, []);

    const createNode = useCallback(
        (cell: IDataQueryCell, savedNode?: Node) => ({
            id: cell.id.toString(),
            type: queryCellNode,
            data: {
                label: cell.meta?.title,
                onDelete: () => handleDeleteNode(cell.id.toString()),
                readonly,
            },
            position: savedNode?.position ?? initialNodePosition,
        }),
        [handleDeleteNode, readonly]
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
            setNodes((nodes) => nodes.concat([createNode(item.itemInfo)]));
        },
        canDrop: () => !readonly,
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    return [nodes, edges, setNodes, setEdges, dropRef] as const;
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
