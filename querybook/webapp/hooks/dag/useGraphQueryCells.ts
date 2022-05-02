import { queryCellDraggableType } from 'components/DataDocDAGExporter/DataDocDAGExporter';
import { IDataQueryCell } from 'const/datadoc';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import React from 'react';
import { useDrop } from 'react-dnd';

import { IStoreState } from 'redux/store/types';
import * as dataDocSelectors from 'redux/dataDoc/selector';

import { IDragItem } from 'ui/DraggableList/types';

export function useGraphQueryCells(docId, savedNodes) {
    const { dataDocCells } = useShallowSelector((state: IStoreState) =>
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

    const deleteGraphQueryCell = React.useCallback((id: number) => {
        setGraphQueryCells((cells) => cells.filter((cell) => cell.id !== id));
    }, []);

    const graphQueryCellIds = React.useMemo(
        () => graphQueryCells.map((cell) => cell.id),
        [graphQueryCells]
    );

    const unusedQueryCells = React.useMemo(
        () => queryCells.filter((cell) => !graphQueryCellIds.includes(cell.id)),
        [queryCells, graphQueryCellIds]
    );

    React.useEffect(() => {
        const savedNodeIds = savedNodes.map((node) => Number(node.id));
        setGraphQueryCells(
            queryCells.filter((cell) => savedNodeIds.includes(cell.id))
        );
    }, [queryCells, savedNodes]);

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

    return { deleteGraphQueryCell, unusedQueryCells, graphQueryCells, dropRef };
}
