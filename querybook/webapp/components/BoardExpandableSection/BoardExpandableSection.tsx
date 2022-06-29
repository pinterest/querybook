import clsx from 'clsx';
import * as React from 'react';
import { useDrop } from 'react-dnd';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';

import { BoardCreateUpdateModal } from 'components/BoardCreateUpdateModal/BoardCreateUpdateModal';
import {
    BoardDraggableType,
    DataDocDraggableType,
    IProcessedBoardItem,
} from 'components/DataDocNavigator/navigatorConst';
import { BoardItemType } from 'const/board';
import { IDataDoc } from 'const/datadoc';
import { useMakeSelector } from 'hooks/redux/useMakeSelector';
import {
    deleteBoardItem,
    fetchBoardIfNeeded,
    moveBoardItem,
} from 'redux/board/action';
import { makeBoardItemsSelector } from 'redux/board/selector';
import { setDataDocNavBoard } from 'redux/querybookUI/action';
import { dataDocNavBoardOpenSelector } from 'redux/querybookUI/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IDragItem } from 'ui/DraggableList/types';
import { LoadingIcon } from 'ui/Loading/Loading';

import { BoardExpandableHeader } from './BoardExpandableHeader';
import { BoardExpandableList } from './BoardExpandableList';

import './BoardExpandableSection.scss';

export const BoardExpandableSection: React.FunctionComponent<{
    id: number;
    filterString: string;
    selectedDocId: number;
    onMoveBoardItem: (
        itemType: string,
        itemInfo: IProcessedBoardItem | IDataDoc,
        toBoardId: number
    ) => void;
}> = ({ id, selectedDocId, filterString, onMoveBoardItem }) => {
    const [showUpdateModal, setShowUpdateModal] = React.useState(false);
    const dispatch: Dispatch = useDispatch();

    const collapsed = !useSelector((state: IStoreState) =>
        dataDocNavBoardOpenSelector(state, id)
    );

    const board = useSelector(
        (state: IStoreState) => state.board.boardById[id]
    );
    const boardItemIds = board?.items;
    const items = useMakeSelector(makeBoardItemsSelector, board.id);

    const handleDeleteBoardItem = React.useCallback(
        async (itemId: number, itemType: BoardItemType) => {
            await dispatch(deleteBoardItem(board.id, itemType, itemId));
            // TODO: Consider not duplicating this logic in BoardItemAddButton
            toast.success(`Item removed from the list "${board.name}"`);
        },
        [board]
    );

    const handleLocalMoveBoardItem = React.useCallback(
        (fromIndex: number, toIndex: number) =>
            dispatch(moveBoardItem(board.id, fromIndex, toIndex)),
        [board]
    );

    React.useEffect(() => {
        if (!collapsed) {
            dispatch(fetchBoardIfNeeded(id));
        }
    }, [id, collapsed]);

    const [{ isOver }, dropRef] = useDrop({
        accept: [BoardDraggableType, DataDocDraggableType],
        drop: (item: IDragItem<IProcessedBoardItem | IDataDoc>, monitor) => {
            // You shouldn't be able to drag and drop to your original board
            if (monitor.didDrop()) {
                return;
            }
            onMoveBoardItem(item.type, item.itemInfo, id);
        },

        collect: (monitor) => {
            const item: IDragItem = monitor.getItem();

            return {
                isOver:
                    item?.type === BoardDraggableType &&
                    item.itemInfo['boardId'] === id
                        ? false
                        : monitor.isOver(),
            };
        },
    });

    const contentSection = collapsed ? null : boardItemIds ? (
        <BoardExpandableList
            filterString={filterString}
            selectedDocId={selectedDocId}
            boardId={id}
            onDeleteBoardItem={handleDeleteBoardItem}
            onMoveBoardItem={handleLocalMoveBoardItem}
            items={items}
        />
    ) : (
        <div>
            <LoadingIcon />
        </div>
    );

    const setCollapsed = React.useCallback(
        (newCollapsed) => dispatch(setDataDocNavBoard(id, !newCollapsed)),
        [id]
    );

    return (
        <div
            className={clsx({
                BoardExpandableSection: true,
                'dragged-over': isOver,
            })}
            ref={dropRef}
        >
            <BoardExpandableHeader
                boardId={board.id}
                boardName={board.name}
                boardData={board}
                collapsed={collapsed}
                onEdit={() => setShowUpdateModal(true)}
                toggleCollapsed={() => setCollapsed(!collapsed)}
            />
            {contentSection}
            {showUpdateModal ? (
                <BoardCreateUpdateModal
                    onComplete={() => setShowUpdateModal(false)}
                    onHide={() => setShowUpdateModal(false)}
                    boardId={id}
                />
            ) : null}
        </div>
    );
};
