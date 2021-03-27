import clsx from 'clsx';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDrop } from 'react-dnd';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';

import { IDataDoc, emptyDataDocTitleMessage } from 'const/datadoc';
import {
    BoardItemType,
    BoardOrderBy,
    BoardOrderToDescription,
    BoardOrderToTitle,
} from 'const/board';

import { BoardCreateUpdateModal } from 'components/BoardCreateUpdateModal/BoardCreateUpdateModal';
import { getWithinEnvUrl } from 'lib/utils/query-string';

import { myBoardsSelector, makeBoardItemsSelector } from 'redux/board/selector';
import {
    fetchBoards,
    deleteBoardItem,
    moveBoardItem,
    fetchBoardIfNeeded,
    addBoardItem,
} from 'redux/board/action';
import { setDataDocNavBoard } from 'redux/querybookUI/action';
import { dataDocNavBoardOpenSelector } from 'redux/querybookUI/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { getEnumEntries } from 'lib/typescript';

import { IconButton } from 'ui/Button/IconButton';
import { LoadingIcon } from 'ui/Loading/Loading';
import { Level, LevelItem } from 'ui/Level/Level';
import { DraggableList } from 'ui/DraggableList/DraggableList';
import { Icon } from 'ui/Icon/Icon';
import { IDataTable } from 'const/metastore';
import { Title } from 'ui/Title/Title';
import { ListLink } from 'ui/Link/ListLink';
import { IDragItem } from 'ui/DraggableList/types';

import { BoardDraggableType, DataDocDraggableType } from './navigatorConst';
import './DataDocNavigatorBoardSection.scss';
import { TextToggleButton } from 'ui/Button/TextToggleButton';

interface INavigatorBoardSectionProps {
    selectedDocId: number;
    collapsed: boolean;
    setCollapsed: (v: boolean) => any;
    filterString: string;
}

const BoardOrderByOptions = getEnumEntries(BoardOrderBy);

export const DataDocNavigatorBoardSection: React.FC<INavigatorBoardSectionProps> = ({
    selectedDocId,
    collapsed,
    setCollapsed,
    filterString,
}) => {
    const toggleCollapsed = useCallback(() => setCollapsed(!collapsed), [
        setCollapsed,
        collapsed,
    ]);

    const [showCreateModal, setShowCreateModal] = useState(false);
    const boardItemById = useSelector(
        (state: IStoreState) => state.board.boardItemById
    );

    const [orderBoardBy, setOrderBoardBy] = useState(BoardOrderBy.updatedAt);
    const unorderedBoards = useSelector(myBoardsSelector);
    const boards = useMemo(
        () =>
            orderBoardBy === BoardOrderBy.alphabetical
                ? [...unorderedBoards].sort((a, b) =>
                      a.name.localeCompare(b.name)
                  )
                : orderBoardBy === BoardOrderBy.createdAt
                ? [...unorderedBoards].sort(
                      (a, b) => b.created_at - a.created_at
                  )
                : unorderedBoards, // order by updated at by default,
        [unorderedBoards, orderBoardBy]
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
                if (sourceType === 'board' && sourceBoardId != null) {
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
                } else if (sourceType === 'datadoc') {
                    await dispatch(
                        addBoardItem(toBoardId, 'data_doc', sourceItemId)
                    );
                }
            }
        },
        [boards, boardItemById]
    );

    const sectionHeader = (
        <Level className="pl8 navigator-board-header">
            <div className="flex1 flex-row" onClick={toggleCollapsed}>
                <Icon name="list" className="mr8" size={18} />
                <Title size={7}>Lists</Title>
            </div>

            <LevelItem>
                {showBoardOrderBy ? (
                    <TextToggleButton
                        value={false}
                        onChange={() =>
                            setOrderBoardBy(
                                (oldValue) =>
                                    BoardOrderByOptions[
                                        (Number(oldValue) + 1) %
                                            BoardOrderByOptions.length
                                    ][1] as BoardOrderBy
                            )
                        }
                        tooltip={`Order By ${BoardOrderToDescription[orderBoardBy]}`}
                        tooltipPos="left"
                        text={BoardOrderToTitle[orderBoardBy]}
                    />
                ) : null}

                <IconButton
                    icon="plus"
                    onClick={() => setShowCreateModal(true)}
                    tooltip="New List"
                    tooltipPos="left"
                />
                <IconButton
                    icon={collapsed ? 'chevron-right' : 'chevron-down'}
                    onClick={toggleCollapsed}
                />
            </LevelItem>
        </Level>
    );

    const boardsDOM = collapsed ? null : (
        <div>
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
    );

    return (
        <div className="DataDocNavigatorBoardSection">
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

    const headerSectionDOM = (
        <div className="horizontal-space-between board-header-section pl12">
            <div
                onClick={() => setCollapsed(!collapsed)}
                className="board-header-title flex1"
            >
                <Title size={7} className="one-line-ellipsis">
                    {board.name}
                </Title>
            </div>

            <div className="header-control-section">
                <span className="hover-control-section">
                    <IconButton
                        size={18}
                        icon="edit-3"
                        onClick={() => setShowUpdateModal(true)}
                        noPadding
                    />
                </span>

                <IconButton
                    icon={collapsed ? 'chevron-right' : 'chevron-down'}
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

export interface IProcessedBoardItem {
    id: number;
    key: string;
    icon: string;
    itemUrl: string;
    itemId: number;
    itemType: BoardItemType;
    title: string;
    selected: boolean;
    boardId: number;
}

const BoardExpandableList: React.FunctionComponent<{
    selectedDocId: number;
    filterString: string;
    boardId: number;
    onDeleteBoardItem: (itemId: number, itemType: BoardItemType) => any;
    onMoveBoardItem: (fromIndex: number, toIndex: number) => any;
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
                    boardItem['data_doc_id'] != null ? 'data_doc' : 'table';
                let key: string;
                let icon = null;
                let itemUrl = '';
                let title = null;
                let selected = false;
                const itemId = itemData.id;

                if (itemType === 'data_doc') {
                    const doc = itemData as IDataDoc;
                    key = `data-doc-${doc.id}`;
                    icon = 'file';
                    title = doc.title ?? emptyDataDocTitleMessage;
                    itemUrl = `/datadoc/${doc.id}/`;
                    selected = selectedDocId === itemData.id;
                } else {
                    // table
                    const table = itemData as IDataTable;
                    key = `table-${table.id}`;
                    icon = 'database';
                    title = table.name;
                    itemUrl = `/table/${table.id}/`;
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
                    boardId: item.boardItem.board_id,
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
                const {
                    key,
                    itemType,
                    icon,
                    title,
                    itemUrl,
                    selected,
                    itemId,
                    id,
                } = item;
                if (itemsToHideSet.has(id)) {
                    return null;
                }

                return (
                    <Level key={key} className="board-item-list-row">
                        <ListLink
                            className={clsx({
                                'flex1 pr8': true,
                                selected,
                            })}
                            to={{
                                pathname: getWithinEnvUrl(itemUrl),
                                state: {
                                    isModal: itemType !== 'data_doc',
                                },
                            }}
                            placeholder={null}
                            isRow
                        >
                            <Icon size={16} className="mr4" name={icon} />
                            {title.length ? (
                                <span className="ListLinkText">{title}</span>
                            ) : (
                                <span className="ListLinkPlaceholder">
                                    Untitled
                                </span>
                            )}
                            <IconButton
                                className="delete-board-item-button"
                                noPadding
                                size={16}
                                icon="x"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    event.preventDefault();
                                    onDeleteBoardItem(itemId, itemType);
                                }}
                            />
                        </ListLink>
                    </Level>
                );
            }}
        />
    );

    const itemsDOM =
        items.length > 0 ? (
            items.length > itemsToHideSet.size ? (
                makeItemsDOM()
            ) : (
                <div className="board-item-list-empty ph12">
                    No items found in this list.
                </div>
            )
        ) : (
            <div className="board-item-list-empty ph12">
                No items in this list yet.
            </div>
        );

    return <div className="board-item-list">{itemsDOM}</div>;
};
