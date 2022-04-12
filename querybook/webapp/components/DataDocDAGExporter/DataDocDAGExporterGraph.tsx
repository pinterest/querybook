import * as React from 'react';
import { IDataQueryCell } from 'const/datadoc';
import { FlowGraph, initialNodePosition } from 'ui/FlowGraph/FlowGraph';

interface IProps {
    queryCells: IDataQueryCell[];
}

const queryCellNode = 'queryCellNode';

export const DataDocDAGExporterGraph: React.FunctionComponent<IProps> = ({
    queryCells,
}) => {
    const nodes = React.useMemo(
        () =>
            queryCells.map((cell) => ({
                id: cell.id.toString(),
                type: queryCellNode,
                data: {
                    label: cell.meta.title,
                },
                position: initialNodePosition,
            })),
        [queryCells]
    );

    return (
        <div className="DataDocDAGExporterGraph">
            <FlowGraph isInteractive={true} nodes={nodes} edges={[]} />
        </div>
    );
};
