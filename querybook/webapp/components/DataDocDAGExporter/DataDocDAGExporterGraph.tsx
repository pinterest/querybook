import * as React from 'react';
import { IDataQueryCell } from 'const/datadoc';
import { FlowGraph, initialNodePosition } from 'ui/FlowGraph/FlowGraph';
import { QueryCellNode } from 'ui/FlowGraph/QueryCellNode';

interface IProps {
    queryCells: IDataQueryCell[];
    deleteCell: (id: number) => void;
}

const queryCellNode = 'queryCellNode';

export const DataDocDAGExporterGraph: React.FunctionComponent<IProps> = ({
    queryCells,
    deleteCell,
}) => {
    const nodes = React.useMemo(
        () =>
            queryCells.map((cell) => ({
                id: cell.id.toString(),
                type: queryCellNode,
                data: {
                    label: cell.meta.title,
                    onDelete: () => deleteCell(cell.id),
                },
                position: initialNodePosition,
            })),
        [deleteCell, queryCells]
    );

    return (
        <div className="DataDocDAGExporterGraph">
            <FlowGraph
                isInteractive={true}
                nodes={nodes}
                edges={[]}
                nodeTypes={{ queryCellNode: QueryCellNode }}
            />
        </div>
    );
};
