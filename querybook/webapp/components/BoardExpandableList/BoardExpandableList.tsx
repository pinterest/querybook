import * as React from 'react';

import {
    BoardDraggableType,
    IProcessedBoardItem,
} from 'components/DataDocNavigator/navigatorConst';
import { BoardItemType, IBoard, IBoardItem } from 'const/board';
import { emptyDataDocTitleMessage, IDataDoc } from 'const/datadoc';
import { IDataTable } from 'const/metastore';
import { IQueryExecution } from 'const/queryExecution';
import { DraggableList } from 'ui/DraggableList/DraggableList';
import { IDragItem } from 'ui/DraggableList/types';

import { BoardListItemRow } from './BoardListItemRow';

interface IBoardExpandableListProps {
    selectedDocId: number;
    selectedBoardId: number;
    filterString: string;
    boardId: number;
    items: Array<{
        boardItem: Partial<IBoardItem>;
        itemData: IBoard | IDataDoc | IDataTable | IQueryExecution;
        id: number;
    }>;
    onDeleteBoardItem?: (itemId: number, itemType: BoardItemType) => void;
    onMoveBoardItem?: (fromIndex: number, toIndex: number) => void;
}

export const BoardExpandableList: React.FunctionComponent<
    IBoardExpandableListProps
> = ({
    filterString,
    selectedDocId,
    selectedBoardId,
    boardId,
    onDeleteBoardItem,
    onMoveBoardItem,
    items,
}) => {
    const processedItems: IProcessedBoardItem[] = React.useMemo(
        () =>
            items
                .filter((item) => item.itemData)
                .map((item) => {
                    const { boardItem, itemData, id } = item;
                    const itemType: BoardItemType =
                        boardItem['data_doc_id'] != null
                            ? 'data_doc'
                            : boardItem['table_id'] != null
                            ? 'table'
                            : boardItem['board_id'] != null
                            ? 'board'
                            : 'query';
                    let key: string;
                    let icon = null;
                    let itemUrl = '';
                    let title = null;
                    let selected = false;
                    const itemId = itemData?.id;

                    if (itemType === 'data_doc') {
                        const doc = itemData as IDataDoc;
                        key = `data-doc-${doc.id}`;
                        icon = 'File';
                        title = doc.title ?? emptyDataDocTitleMessage;
                        itemUrl = `/datadoc/${doc.id}/`;
                        selected = selectedDocId === doc.id;
                    } else if (itemType === 'table') {
                        const table = itemData as IDataTable;
                        key = `table-${table.id}`;
                        icon = 'Database';
                        title = table.name;
                        itemUrl = `/table/${table.id}/`;
                    } else if (itemType === 'board') {
                        const board = itemData as IBoard;
                        key = `board-${board.id}`;
                        icon = 'Briefcase';
                        title = board.name;
                        itemUrl = `/list/${board.id}/`;
                        selected = selectedBoardId === board.id;
                    } else {
                        // query execution
                        const queryExecution = itemData as IQueryExecution;
                        key = `execution-${queryExecution.id}`;
                        icon = 'PlayCircle';
                        title = 'Execution ' + queryExecution.id;
                        itemUrl = `/query_execution/${queryExecution.id}/`;
                    }

                    return {
                        id,
                        key,
                        icon,
                        itemUrl,
                        itemId,
                        itemType,
                        title,
                        selected,
                        boardId: item.boardItem['parent_board_id'] ?? 0,
                    };
                }),
        [items, selectedDocId]
    );

    const itemsToHideSet: Set<number> = React.useMemo(
        () =>
            filterString
                ? new Set(
                      processedItems
                          .filter(
                              (item) =>
                                  !item.title
                                      ?.toLowerCase()
                                      .includes(filterString)
                          )
                          .map((item) => item.id)
                  )
                : new Set(),
        [processedItems, filterString]
    );

    const canDrop = React.useCallback(
        (item: IDragItem<IProcessedBoardItem>) =>
            item.itemInfo.boardId === boardId,
        [boardId]
    );

    const makeItemsDOM = () => (
        <DraggableList
            canDrop={canDrop}
            itemType={BoardDraggableType}
            items={processedItems}
            onMove={onMoveBoardItem}
            renderItem={(idx, item) => {
                const { id } = item;
                if (itemsToHideSet.has(id)) {
                    return null;
                }

                return (
                    <BoardListItemRow
                        item={item}
                        onDeleteBoardItem={onDeleteBoardItem}
                    />
                );
            }}
        />
    );

    const itemsDOM =
        items.length > 0 ? (
            items.length > itemsToHideSet.size ? (
                makeItemsDOM()
            ) : (
                <div className="empty-section-message">No items found</div>
            )
        ) : (
            <div className="empty-section-message">No items</div>
        );

    return <div className="board-item-list">{itemsDOM}</div>;
};
