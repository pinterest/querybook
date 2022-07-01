import clsx from 'clsx';
import * as React from 'react';
import { useDrop } from 'react-dnd';
import { useDispatch, useSelector } from 'react-redux';

import { BoardCreateUpdateModal } from 'components/BoardCreateUpdateModal/BoardCreateUpdateModal';
import {
    BoardDraggableType,
    DataDocDraggableType,
    IProcessedBoardItem,
} from 'components/DataDocNavigator/navigatorConst';
import { IDataDoc } from 'const/datadoc';
import { useBoardItemActions } from 'hooks/board/useBoardItemActions';
import { useMakeSelector } from 'hooks/redux/useMakeSelector';
import { fetchBoardIfNeeded } from 'redux/board/action';
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
    selectedBoardId: number;
    onMoveBoardItem: (
        itemType: string,
        itemInfo: IProcessedBoardItem | IDataDoc,
        toBoardId: number
    ) => void;
}> = ({
    id,
    selectedDocId,
    selectedBoardId,
    filterString,
    onMoveBoardItem,
}) => {
    const [showUpdateModal, setShowUpdateModal] = React.useState(false);
    const dispatch: Dispatch = useDispatch();

    const collapsed = !useSelector((state: IStoreState) =>
        dataDocNavBoardOpenSelector(state, id)
    );

    React.useEffect(() => {
        if (!collapsed) {
            dispatch(fetchBoardIfNeeded(id));
        }
    }, [id, collapsed]);

    const board = useSelector(
        (state: IStoreState) => state.board.boardById[id]
    );
    const boardItemIds = board?.items;
    const items = useMakeSelector(makeBoardItemsSelector, board.id);

    const {
        handleDeleteBoardItem,
        handleMoveBoardItem: handleLocalMoveBoardItem,
    } = useBoardItemActions(board);

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
            selectedBoardId={selectedBoardId}
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
