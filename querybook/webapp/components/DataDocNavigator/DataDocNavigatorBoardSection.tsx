import clsx from 'clsx';
import { orderBy } from 'lodash';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { useDrag, useDrop } from 'react-dnd';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';

import { BoardCreateUpdateModal } from 'components/BoardCreateUpdateModal/BoardCreateUpdateModal';
import history from 'lib/router-history';
import {
    BoardItemType,
    BoardOrderBy,
    BoardOrderToDescription,
    BoardOrderToTitle,
    IBoard,
} from 'const/board';
import { emptyDataDocTitleMessage, IDataDoc } from 'const/datadoc';
import { IDataTable } from 'const/metastore';
import { getEnumEntries } from 'lib/typescript';
import {
    addBoardItem,
    deleteBoardItem,
    fetchBoardIfNeeded,
    fetchBoards,
    moveBoardItem,
} from 'redux/board/action';
import { makeBoardItemsSelector, myBoardsSelector } from 'redux/board/selector';
import { setDataDocNavBoard } from 'redux/querybookUI/action';
import { dataDocNavBoardOpenSelector } from 'redux/querybookUI/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { DraggableList } from 'ui/DraggableList/DraggableList';
import { IDragItem } from 'ui/DraggableList/types';
import { Icon } from 'ui/Icon/Icon';
import { Level, LevelItem } from 'ui/Level/Level';
import { LoadingIcon } from 'ui/Loading/Loading';
import { OrderByButton } from 'ui/OrderByButton/OrderByButton';
import { Title } from 'ui/Title/Title';

import { BoardListItemRow } from './DataDocNavigatorBoardItem';
import {
    BoardDraggableType,
    DataDocDraggableType,
    IProcessedBoardItem,
} from './navigatorConst';

import './DataDocNavigatorBoardSection.scss';
import { UrlContextMenu } from 'ui/ContextMenu/UrlContextMenu';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { ListLink } from 'ui/Link/ListLink';

interface INavigatorBoardSectionProps {
    selectedDocId: number;
    collapsed: boolean;
    setCollapsed: (v: boolean) => any;
    filterString: string;
}

const BoardOrderByOptions = getEnumEntries(BoardOrderBy);

export const DataDocNavigatorBoardSection: React.FC<
    INavigatorBoardSectionProps
> = ({ selectedDocId, collapsed, setCollapsed, filterString }) => {
    const toggleCollapsed = useCallback(
        () => setCollapsed(!collapsed),
        [setCollapsed, collapsed]
    );

    const [showCreateModal, setShowCreateModal] = useState(false);
    const boardItemById = useSelector(
        (state: IStoreState) => state.board.boardItemById
    );

    const [orderBoardByAsc, setOrderBoardByAsc] = useState(false);
    const [orderBoardBy, setOrderBoardBy] = useState(BoardOrderBy.updatedAt);
    const unorderedBoards = useSelector(myBoardsSelector);
    const boards = useMemo(
        () =>
            orderBy(
                unorderedBoards,
                orderBoardBy === BoardOrderBy.alphabetical
                    ? 'name'
                    : orderBoardBy === BoardOrderBy.createdAt
                    ? 'created_at'
                    : 'updated_at',
                orderBoardByAsc ? 'asc' : 'desc'
            ),

        [unorderedBoards, orderBoardBy, orderBoardByAsc]
    );
    const showBoardOrderBy = boards.length > 1;

    const dispatch: Dispatch = useDispatch();
    useEffect(() => {
        if (!collapsed && boards.length === 0) {
            dispatch(fetchBoards());
        }
    }, [collapsed]);

    const handleMoveBoardItem = useCallback(
        async (
            itemType: string,
            itemInfo: IProcessedBoardItem | IDataDoc,
            toBoardId: number
        ) => {
            let sourceType: 'datadoc' | 'board' = null;
            let sourceBoardId: number = null;
            let sourceItemId: number = null;

            if (itemType === BoardDraggableType) {
                const boardItem = itemInfo as IProcessedBoardItem;

                sourceType = 'board';
                sourceBoardId = boardItem.boardId;
                sourceItemId = boardItem.id;
            } else if (itemType === DataDocDraggableType) {
                sourceType = 'datadoc';
                sourceItemId = (itemInfo as IDataDoc).id;
            }

            if (sourceItemId != null) {
                if (sourceType === 'datadoc') {
                    await dispatch(
                        addBoardItem(toBoardId, 'data_doc', sourceItemId)
                    );
                } else if (sourceType === 'board' && sourceBoardId == null) {
                    await dispatch(
                        addBoardItem(toBoardId, 'board', itemInfo.id)
                    );
                } else {
                    const boardItem = boardItemById[sourceItemId];
                    const boardItemType =
                        boardItem['data_doc_id'] != null ? 'data_doc' : 'table';
                    const boardItemItemId =
                        boardItemType === 'data_doc'
                            ? boardItem.data_doc_id
                            : boardItem.table_id;
                    await dispatch(
                        addBoardItem(toBoardId, boardItemType, boardItemItemId)
                    );
                    await dispatch(
                        deleteBoardItem(
                            sourceBoardId,
                            boardItemType,
                            boardItemItemId
                        )
                    );
                }
            }
        },
        [boards, boardItemById]
    );

    const sectionHeader = (
        <Level className="pl8 navigator-header">
            <div className="flex1 flex-row" onClick={toggleCollapsed}>
                <Icon name="List" className="mr8" size={18} />
                <Title size="small">Lists</Title>
            </div>

            <LevelItem>
                {showBoardOrderBy ? (
                    <OrderByButton
                        asc={orderBoardByAsc}
                        onAscToggle={() => setOrderBoardByAsc((v) => !v)}
                        orderByField={BoardOrderToDescription[orderBoardBy]}
                        orderByFieldSymbol={BoardOrderToTitle[orderBoardBy]}
                        onOrderByFieldToggle={() =>
                            setOrderBoardBy(
                                (oldValue) =>
                                    BoardOrderByOptions[
                                        (Number(oldValue) + 1) %
                                            BoardOrderByOptions.length
                                    ][1] as BoardOrderBy
                            )
                        }
                    />
                ) : null}
                <IconButton
                    icon="Plus"
                    onClick={() => setShowCreateModal(true)}
                    tooltip="New List"
                    tooltipPos="left"
                />
                <IconButton
                    icon={collapsed ? 'ChevronRight' : 'ChevronDown'}
                    onClick={toggleCollapsed}
                />
            </LevelItem>
        </Level>
    );

    const boardsDOM = collapsed ? null : boards.length ? (
        <div className="ml8">
            {boards.map((board) => (
                <NavigatorBoardView
                    key={board.id}
                    id={board.id}
                    selectedDocId={selectedDocId}
                    filterString={filterString}
                    onMoveBoardItem={handleMoveBoardItem}
                />
            ))}
        </div>
    ) : (
        <div className="empty-section-message">No lists</div>
    );

    return (
        <div className="DataDocNavigatorSection mb12">
            {sectionHeader}
            {boardsDOM}
            {showCreateModal ? (
                <BoardCreateUpdateModal
                    onComplete={() => setShowCreateModal(false)}
                    onHide={() => setShowCreateModal(false)}
                />
            ) : null}
        </div>
    );
};

const NavigatorBoardView: React.FunctionComponent<{
    id: number;
    filterString: string;
    selectedDocId: number;
    onMoveBoardItem: (
        itemType: string,
        itemInfo: IProcessedBoardItem | IDataDoc,
        toBoardId: number
    ) => void;
}> = ({ id, selectedDocId, filterString, onMoveBoardItem }) => {
    const selfRef = useRef<HTMLDivElement>();

    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const dispatch: Dispatch = useDispatch();

    const collapsed = !useSelector((state: IStoreState) =>
        dataDocNavBoardOpenSelector(state, id)
    );
    const setCollapsed = useCallback(
        (newCollapsed) => dispatch(setDataDocNavBoard(id, !newCollapsed)),
        [id]
    );

    const board = useSelector(
        (state: IStoreState) => state.board.boardById[id]
    );
    const boardItems = board?.items;
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

    useEffect(() => {
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

    const boardUrl = React.useMemo(
        () => getWithinEnvUrl(`/list/${board.id}/`),
        [board]
    );
    const handleClick = React.useCallback(() => {
        history.push(boardUrl);
    }, [boardUrl]);

    const [, drag] = useDrag({
        type: BoardDraggableType,
        item: {
            type: BoardDraggableType,
            itemInfo: board,
        },
    });

    const headerSectionDOM = (
        <div
            className={clsx(
                'horizontal-space-between',
                'board-header-section',
                'pl8',
                !collapsed && 'active'
            )}
            ref={drag}
        >
            <div className="flex-row" ref={selfRef}>
                <ListLink
                    className="board-header-title flex1"
                    onClick={handleClick}
                    to={boardUrl}
                    noPlaceHolder
                    isRow
                >
                    <Title
                        size="small"
                        color="light"
                        className="one-line-ellipsis"
                    >
                        {board.name}
                    </Title>
                </ListLink>
                <UrlContextMenu url={boardUrl} anchorRef={selfRef} />
            </div>
            <div className="header-control-section">
                <span className="hover-control-section">
                    <IconButton
                        size={18}
                        icon="Edit3"
                        onClick={() => setShowUpdateModal(true)}
                        noPadding
                    />
                </span>
                <IconButton
                    icon={collapsed ? 'ChevronRight' : 'ChevronDown'}
                    onClick={() => setCollapsed(!collapsed)}
                />
            </div>
        </div>
    );

    const contentSection = collapsed ? null : boardItems ? (
        <BoardExpandableList
            filterString={filterString}
            selectedDocId={selectedDocId}
            boardId={id}
            onDeleteBoardItem={handleDeleteBoardItem}
            onMoveBoardItem={handleLocalMoveBoardItem}
        />
    ) : (
        <div>
            <LoadingIcon />
        </div>
    );

    return (
        <div
            className={clsx({
                NavigatorBoardView: true,
                'dragged-over': isOver,
            })}
            ref={dropRef}
        >
            {headerSectionDOM}
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

const BoardExpandableList: React.FunctionComponent<{
    selectedDocId: number;
    filterString: string;
    boardId: number;
    onDeleteBoardItem: (itemId: number, itemType: BoardItemType) => void;
    onMoveBoardItem: (fromIndex: number, toIndex: number) => void;
}> = ({
    filterString,
    selectedDocId,
    boardId,
    onDeleteBoardItem,
    onMoveBoardItem,
}) => {
    const boardItemsSelector = useMemo(() => makeBoardItemsSelector(), []);
    const items = useSelector((state: IStoreState) =>
        boardItemsSelector(state, boardId)
    );
    const processedItems: IProcessedBoardItem[] = useMemo(
        () =>
            items.map((item) => {
                const { boardItem, itemData, id } = item;
                const itemType: BoardItemType =
                    boardItem['data_doc_id'] != null
                        ? 'data_doc'
                        : boardItem['table_id'] != null
                        ? 'table'
                        : 'board';
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
                    selected = selectedDocId === itemData.id;
                } else if (itemType === 'table') {
                    const table = itemData as IDataTable;
                    key = `table-${table.id}`;
                    icon = 'Database';
                    title = table.name;
                    itemUrl = `/table/${table.id}/`;
                } else {
                    // board
                    const board = itemData as IBoard;
                    key = `board-${board.id}`;
                    icon = 'Briefcase';
                    title = board.name;
                    itemUrl = `/list/${board.id}/`;
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
                    boardId: item.boardItem.parent_board_id,
                };
            }),
        [items, selectedDocId]
    );

    const itemsToHideSet: Set<number> = useMemo(
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

    const canDrop = useCallback(
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
