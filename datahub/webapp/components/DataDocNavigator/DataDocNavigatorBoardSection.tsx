import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';
import { useDrop } from 'react-dnd';

import { IDataDoc, emptyDataDocTitleMessage } from 'const/datadoc';
import { BoardItemType } from 'const/board';

import { BoardCreateUpdateModal } from 'components/BoardCreateUpdateModal/BoardCreateUpdateModal';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { sendNotification, sendConfirm } from 'lib/dataHubUI';

import { boardsSelector, makeBoardItemsSelector } from 'redux/board/selector';
import {
    fetchBoards,
    deleteBoardItem,
    moveBoardItem,
    fetchBoardIfNeeded,
    deleteBoard,
    addBoardItem,
} from 'redux/board/action';
import { setDataDocNavBoard } from 'redux/dataHubUI/action';
import { dataDocNavBoardOpenSelector } from 'redux/dataHubUI/selector';
import { Dispatch, IStoreState } from 'redux/store/types';

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

interface INavigatorBoardSectionProps {
    selectedDocId: number;
    collapsed: boolean;
    setCollapsed: (v: boolean) => any;
    filterString: string;
}
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
    const boards = useSelector(boardsSelector);
    const boardItemById = useSelector(
        (state: IStoreState) => state.board.boardItemById
    );

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
                <Icon name="list" className="mr4" size={18} />
                <Title size={7}>Lists</Title>
            </div>

            <LevelItem>
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
            // TODO: Consider not duplicatiing this logic in BoardItemAddButton
            sendNotification(`Item removed from the list "${board.name}"`);
        },
        [board]
    );

    const handleLocalMoveBoardItem = React.useCallback(
        (fromIndex: number, toIndex: number) => {
            return dispatch(moveBoardItem(board.id, fromIndex, toIndex));
        },
        [board]
    );

    useEffect(() => {
        if (!collapsed) {
            dispatch(fetchBoardIfNeeded(id));
        }
    }, [id, collapsed]);

    const [{ isOver }, dropRef] = useDrop({
        accept: [BoardDraggableType, DataDocDraggableType],
        drop(item: IDragItem<IProcessedBoardItem | IDataDoc>, monitor) {
            // You shouldn't be able to drag and drop to your original board
            if (monitor.didDrop()) {
                return;
            }
            onMoveBoardItem(item.type, item.itemInfo, id);
        },

        collect(monitor) {
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
        <div className="horizontal-space-between board-header-section pl8 ml4">
            <div
                onClick={() => setCollapsed(!collapsed)}
                className="board-header-title flex1"
            >
                <Title size={7}>{board.name}</Title>
            </div>

            <div className="header-control-section">
                <span className="hover-control-section">
                    <IconButton
                        size={18}
                        icon="trash"
                        onClick={() =>
                            sendConfirm({
                                onConfirm: () => {
                                    dispatch(deleteBoard(id));
                                },
                                message:
                                    'Your list will be permanently removed.',
                            })
                        }
                        noPadding
                        className="mr4"
                    />
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
            className={classNames({
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
                          .filter((item) => {
                              return !item.title
                                  ?.toLowerCase()
                                  .includes(filterString);
                          })
                          .map((item) => item.id)
                  )
                : new Set(),
        [processedItems, filterString]
    );

    const canDrop = useCallback(
        (item: IDragItem<IProcessedBoardItem>) => {
            return item.itemInfo.boardId === boardId;
        },
        [boardId]
    );

    const makeItemsDOM = () => (
        <DraggableList
            canDrop={canDrop}
            itemType={BoardDraggableType}
            items={processedItems}
            onMove={(fromIndex, toIndex) => {
                onMoveBoardItem(fromIndex, toIndex);
            }}
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
                            className={classNames({
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
                            <span className="ListLinkText">{title}</span>
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
