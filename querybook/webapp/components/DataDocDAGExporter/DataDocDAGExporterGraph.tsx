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
}

const queryCellNode = 'queryCellNode';

export const DataDocDAGExporterGraph: React.FunctionComponent<IProps> = ({
    queryCells,
    savedNodes,
    savedEdges,
    onDeleteCell,
}) => {
    const [nodes, setNodes] = React.useState([]);

    const convertCellToNode = React.useCallback(
        (cell: IDataQueryCell, savedPosition = undefined) => ({
            id: cell.id.toString(),
            type: queryCellNode,
            data: {
                label: cell.meta.title,
                onDelete: () => onDeleteCell(cell.id),
            },
            position: savedPosition ?? initialNodePosition,
        }),
        [onDeleteCell]
    );

    React.useEffect(() => {
        setNodes(queryCells.map(convertCellToNode));
    }, [convertCellToNode, queryCells]);

    React.useEffect(() => {
        const savedPositionById = {};
        savedNodes.forEach((node) => {
            savedPositionById[node.id] = node.position;
        });
        setNodes((currentCells) =>
            currentCells.map((cell) =>
                convertCellToNode(cell, savedPositionById[cell.id])
            )
        );
    }, [convertCellToNode, savedNodes]);

    return (
        <div className="DataDocDAGExporterGraph">
            <FlowGraph
                isInteractive={true}
                nodes={nodes}
                edges={savedEdges}
                nodeTypes={{ queryCellNode: QueryCellNode }}
            />
        </div>
    );
};
