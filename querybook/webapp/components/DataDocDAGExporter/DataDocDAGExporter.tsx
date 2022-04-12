import * as React from 'react';
import { useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';

import * as dataDocSelectors from 'redux/dataDoc/selector';
import { IStoreState } from 'redux/store/types';
import { IDataQueryCell } from 'const/datadoc';

import { DataDocDagExporterList } from './DataDocDAGExporterList';
import { DataDocDAGExporterGraph } from './DataDocDAGExporterGraph';
import { IDragItem } from 'ui/DraggableList/types';

import './DataDocDAGExporter.scss';

interface IProps {
    docId: number;
    isEditable: boolean;
}

export const queryCellDraggableType = 'QueryCell-';

export const DataDocDAGExporter: React.FunctionComponent<IProps> = ({
    docId,
    isEditable,
}) => {
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

    const [graphQueryCells, setGraphQueryCells] = React.useState<
        IDataQueryCell[]
    >([]);

    const graphQueryCellIds = React.useMemo(
        () => graphQueryCells.map((cell) => cell.id),
        [graphQueryCells]
    );

    const unusedQueryCells = React.useMemo(
        () => queryCells.filter((cell) => !graphQueryCellIds.includes(cell.id)),
        [queryCells, graphQueryCellIds]
    );

    const [{ isOver }, dropRef] = useDrop({
        accept: [queryCellDraggableType],
        drop: (item: IDragItem<IDataQueryCell>, monitor) => {
            if (monitor.didDrop()) {
                return;
            }
            setGraphQueryCells((curr) => [...curr, item.itemInfo]);
        },

        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    return (
        <div className="DataDocDAGExporter">
            <DataDocDagExporterList queryCells={unusedQueryCells} />
            <div className="DataDocDAGExporter-main">
                <div className="DataDocDAGExporter-graph-wrapper" ref={dropRef}>
                    <DataDocDAGExporterGraph queryCells={graphQueryCells} />
                </div>
            </div>
        </div>
    );
};
