import * as React from 'react';
import { IDataQueryCell } from 'const/datadoc';
import { FlowGraph, initialNodePosition } from 'ui/FlowGraph/FlowGraph';
import { Edge, Node } from 'react-flow-renderer';

import { QueryCellNode } from 'ui/FlowGraph/QueryCellNode';
interface IProps {
    savedNodes: Node[];
    savedEdges: Edge[];
    queryCells: IDataQueryCell[];
    onDeleteCell: (id: number) => void;
    onSaveComponent?: (nodes: Node[], edges: Edge[]) => React.ReactElement;
}

const queryCellNode = 'queryCellNode';

export const DataDocDAGExporterGraph: React.FunctionComponent<IProps> = ({
    queryCells,
    savedNodes,
    savedEdges,
    onDeleteCell,
    onSaveComponent,
}) => {
    const [nodes, setNodes] = React.useState([]);

    const convertCellToNode = React.useCallback(
        (cell: IDataQueryCell, savedPosition = undefined) => ({
            id: cell.id.toString(),
            type: queryCellNode,
            data: {
                label: cell.meta?.title,
                onDelete: () => onDeleteCell(cell.id),
            },
            position: savedPosition || initialNodePosition,
        }),
        [onDeleteCell]
    );

    React.useEffect(() => {
        setNodes(queryCells.map((cell) => convertCellToNode(cell)));
    }, [convertCellToNode, queryCells]);

    React.useEffect(() => {
        if (nodes.length === 0) {
            const savedPositionsById = {};
            savedNodes.forEach((node) => {
                savedPositionsById[node.id] = node.position;
            });
            const positionedSavedNodes = queryCells.map((cell) =>
                convertCellToNode(cell, savedPositionsById[cell.id.toString()])
            );
            setNodes(positionedSavedNodes);
        }
    }, [convertCellToNode, nodes.length, queryCells, savedNodes]);

    return (
        <div className="DataDocDAGExporterGraph">
            <FlowGraph
                isInteractive={true}
                nodes={nodes}
                edges={savedEdges}
                nodeTypes={{ queryCellNode: QueryCellNode }}
                onSaveComponent={onSaveComponent}
            />
        </div>
    );
};
