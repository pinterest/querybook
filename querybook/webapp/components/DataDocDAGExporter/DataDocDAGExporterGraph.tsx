import * as React from 'react';
import { IDataQueryCell } from 'const/datadoc';
import { FlowGraph, initialNodePosition } from 'ui/FlowGraph/FlowGraph';
import { Edge, Node } from 'react-flow-renderer';

interface IProps {
    queryCells: IDataQueryCell[];
    savedNodes: Node[];
    savedEdges: Edge[];
}

const queryCellNode = 'queryCellNode';

const convertCellToNode = (
    cell: IDataQueryCell,
    savedPosition = undefined
) => ({
    id: cell.id.toString(),
    type: queryCellNode,
    data: {
        label: cell.meta.title,
    },
    position: savedPosition ?? initialNodePosition,
});

export const DataDocDAGExporterGraph: React.FunctionComponent<IProps> = ({
    queryCells,
    savedNodes,
    savedEdges,
}) => {
    const [nodes, setNodes] = React.useState([]);

    React.useEffect(() => {
        setNodes(queryCells.map(convertCellToNode));
    }, [queryCells]);

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
    }, [savedNodes]);

    return (
        <div className="DataDocDAGExporterGraph">
            <FlowGraph isInteractive={true} nodes={nodes} edges={savedEdges} />
        </div>
    );
};
