import * as React from 'react';
import { IDataQueryCell } from 'const/datadoc';
import { FlowGraph, initialNodePosition } from 'ui/FlowGraph/FlowGraph';

interface IProps {
    queryCells: IDataQueryCell[];
}

export const DataDocDAGExporterGraph: React.FunctionComponent<IProps> = ({
    queryCells,
}) => {
    const nodes = queryCells.map((cell) => ({
        id: cell.id.toString(),
        type: 'queryCellNode',
        data: {
            label: cell.meta.title,
        },
        position: initialNodePosition,
    }));
    console.log('nodes', nodes);

    return (
        <div className="DataDocDAGExporterGraph">
            <FlowGraph isInteractive={true} nodes={nodes} edges={[]} />
        </div>
    );
};
