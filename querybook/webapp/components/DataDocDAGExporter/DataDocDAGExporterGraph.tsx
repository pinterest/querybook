import * as React from 'react';
import { IDataQueryCell } from 'const/datadoc';
import { FlowGraph, initialNodePosition } from 'ui/FlowGraph/FlowGraph';
import { Edge, Node, XYPosition } from 'react-flow-renderer';

import { QueryCellNode } from 'ui/FlowGraph/QueryCellNode';

interface IProps {
    savedNodes: Node[];
    savedEdges: Edge[];
    queryCells: IDataQueryCell[];
    onDeleteCell: (id: number) => void;
    renderSaveComponent?: (nodes: Node[], edges: Edge[]) => React.ReactElement;
    readonly: boolean;
}

const queryCellNode = 'queryCellNode';

export const DataDocDAGExporterGraph: React.FunctionComponent<IProps> = ({
    queryCells,
    savedNodes,
    savedEdges,
    onDeleteCell,
    renderSaveComponent,
    readonly,
}) => {
    const convertCellToNode = React.useCallback(
        (cell: IDataQueryCell, savedPosition?: XYPosition) => ({
            id: cell.id.toString(),
            type: queryCellNode,
            data: {
                label: cell.meta?.title,
                onDelete: () => onDeleteCell(cell.id),
                readonly,
            },
            position: savedPosition ?? initialNodePosition,
        }),
        [onDeleteCell]
    );

    const nodes = React.useMemo<Node[]>(() => {
        const savedPositionsById: Record<string, XYPosition> = {};
        savedNodes.forEach((node) => {
            savedPositionsById[node.id] = node.position;
        });
        return queryCells.map((cell: IDataQueryCell) =>
            convertCellToNode(cell, savedPositionsById[cell.id])
        );
    }, [convertCellToNode, queryCells, savedNodes]);

    return (
        <div className="DataDocDAGExporterGraph">
            <FlowGraph
                isInteractive={!readonly}
                nodes={nodes}
                edges={savedEdges}
                nodeTypes={{ queryCellNode: QueryCellNode }}
                renderSaveComponent={renderSaveComponent}
            />
        </div>
    );
};
