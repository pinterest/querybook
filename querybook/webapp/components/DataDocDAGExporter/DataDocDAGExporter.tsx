import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useDrop } from 'react-dnd';
import { Edge, Node } from 'react-flow-renderer';

import * as dataDocSelectors from 'redux/dataDoc/selector';
import { IStoreState } from 'redux/store/types';
import { IDataQueryCell } from 'const/datadoc';
import { fetchDAGExport, saveDAGExport } from 'redux/dataDoc/action';

import { DataDocDagExporterList } from './DataDocDAGExporterList';
import { DataDocDAGExporterGraph } from './DataDocDAGExporterGraph';
import { IDragItem } from 'ui/DraggableList/types';
import { Button } from 'ui/Button/Button';

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
    const dispatch = useDispatch();
    const { dataDocCells, savedDAGExport } = useSelector(
        (state: IStoreState) => ({
            dataDocCells: dataDocSelectors.dataDocSelector(state, docId)
                .dataDocCells,
            savedDAGExport: state.dataDoc.dagExportByDocId[docId],
        })
    );

    const onSave = React.useCallback(
        async (nodes: Node[], edges: Edge[]) => {
            dispatch(saveDAGExport(docId, nodes, edges));
        },
        [dispatch, docId]
    );

    const savedNodes = React.useMemo(
        () => (savedDAGExport?.dag?.nodes || []) as Node[],
        [savedDAGExport]
    );
    const savedEdges = React.useMemo(
        () => (savedDAGExport?.dag?.edges || []) as Edge[],
        [savedDAGExport]
    );

    React.useEffect(() => {
        dispatch(fetchDAGExport(docId));
    }, [dispatch, docId]);

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

    return (
        <div className="DataDocDAGExporter">
            <DataDocDagExporterList queryCells={unusedQueryCells} />
            <div className="DataDocDAGExporter-main">
                <div className="DataDocDAGExporter-graph-wrapper" ref={dropRef}>
                    <DataDocDAGExporterGraph
                        queryCells={graphQueryCells}
                        savedNodes={savedNodes}
                        savedEdges={savedEdges}
                        onDeleteCell={deleteGraphQueryCell}
                        renderSaveComponent={(nodes, edges) => (
                            <DataDocDAGExporterSave
                                onSave={() => onSave(nodes, edges)}
                            />
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

export const DataDocDAGExporterSave: React.FunctionComponent<{
    onSave: () => void;
}> = ({ onSave }) => (
    <div className="DataDocDAGExporter-bottom flex-row mr12">
        <Button icon="Save" title="Save Progress" onClick={onSave} />
        <Button icon="FileOutput" title="Export" />
    </div>
);
