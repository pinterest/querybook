import React, { useEffect, useState } from 'react';

import { Title } from 'ui/Title/Title';
import { useSelector, useDispatch } from 'react-redux';
import { boardsSelector, boardItemsSelector } from 'redux/board/selector';
import {
    fetchBoards,
    deleteBoardItem,
    moveBoardItem,
    fetchBoardIfNeeded,
    deleteBoard,
} from 'redux/board/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { BoardItemType } from 'const/board';
import { sendNotification, sendConfirm } from 'lib/dataHubUI';
import { Loading, LoadingIcon } from 'ui/Loading/Loading';
import { Level, LevelItem } from 'ui/Level/Level';
import { SeeMoreText } from 'ui/SeeMoreText/SeeMoreText';
import { Divider } from 'ui/Divider/Divider';
import { BoardCreateUpdateModal } from 'components/BoardCreateUpdateModal/BoardCreateUpdateModal';
import { DraggableList } from 'ui/DraggableList/DraggableList';
import { IDataDoc, emptyDataDocTitleMessage } from 'const/datadoc';
import { Icon } from 'ui/Icon/Icon';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { IDataTable } from 'const/metastore';

import './DataDocNavigatorBoardSection.scss';

interface INavigatorBoardSectionProps {
    selectedDocId: number;
}
export const DataDocNavigatorBoardSection: React.FC<INavigatorBoardSectionProps> = ({}) => {
    const dispatch: Dispatch = useDispatch();
    useEffect(() => {
        dispatch(fetchBoards());
    }, []);

    const boards = useSelector(boardsSelector);

    const sectionHeader = (
        <Level className="pl8">
            <Title size={6}>Boards</Title>
            <IconButton icon="plus" />
        </Level>
    );

    const boardsDOM = boards.map((board) => (
        <NavigatorBoardView key={board.id} id={board.id} />
    ));

    return (
        <div className="DataDocNavigatorBoardSection">
            {sectionHeader}
            {boardsDOM}
        </div>
    );
};

const NavigatorBoardView: React.FunctionComponent<{
    id: number;
}> = ({ id }) => {
    const [collapsed, setCollapsed] = useState(true);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const dispatch: Dispatch = useDispatch();
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

    const handleMoveBoardItem = React.useCallback(
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

    const headerSectionDOM = (
        <div className="horizontal-space-between board-header-section pl8">
            <div onClick={() => setCollapsed(!collapsed)}>
                <Title size={7}>{board.name}</Title>
            </div>

            <div>
                <span className="hover-control">
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
            boardId={id}
            onDeleteBoardItem={handleDeleteBoardItem}
            onMoveBoardItem={handleMoveBoardItem}
        />
    ) : (
        <div>
            <LoadingIcon />
        </div>
    );

    return (
        <div className="NavigatorBoardView">
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
    boardId: number;
    onDeleteBoardItem: (itemId: number, itemType: BoardItemType) => any;
    onMoveBoardItem: (fromIndex: number, toIndex: number) => any;
}> = ({ boardId, onDeleteBoardItem, onMoveBoardItem }) => {
    const items = useSelector((state: IStoreState) =>
        boardItemsSelector(state, boardId).map((item) => ({
            boardItem: item[0],
            itemData: item[1],
            id: item[0].id,
        }))
    );

    const itemsDOM =
        items.length > 0 ? (
            <DraggableList
                items={items}
                onMove={(fromIndex, toIndex) =>
                    onMoveBoardItem(fromIndex, toIndex)
                }
                renderItem={(idx, item) => {
                    const { boardItem, itemData } = item;
                    let key: string;
                    let itemNameDOM: React.ReactElement;
                    let onItemClick: () => any;
                    const itemType =
                        boardItem['data_doc_id'] != null ? 'data_doc' : 'table';

                    if (itemType === 'data_doc') {
                        const doc = itemData as IDataDoc;
                        key = `data-doc-${doc.id}`;
                        itemNameDOM = (
                            <>
                                <Icon name="file" size={16} />
                                <span className="one-line-ellipsis">
                                    {doc.title || emptyDataDocTitleMessage}
                                </span>
                            </>
                        );
                        onItemClick = () =>
                            navigateWithinEnv(`/datadoc/${doc.id}/`);
                    } else {
                        // table
                        const table = itemData as IDataTable;
                        key = `table-${table.id}`;
                        itemNameDOM = (
                            <>
                                <Icon name="database" size={16} />
                                <span className="one-line-ellipsis">
                                    {table.name}
                                </span>
                            </>
                        );
                        onItemClick = () =>
                            navigateWithinEnv(`/table/${table.id}/`, {
                                isModal: true,
                            });
                    }

                    return (
                        <Level
                            className="board-item-list-row flex-row"
                            key={key}
                            onClick={onItemClick}
                        >
                            <LevelItem className="board-item-name-section">
                                {itemNameDOM}
                            </LevelItem>
                            <IconButton
                                className="delete-board-item-button"
                                noPadding
                                size={16}
                                icon="x"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    event.preventDefault();
                                    onDeleteBoardItem(itemData.id, itemType);
                                }}
                            />
                        </Level>
                    );
                }}
            />
        ) : (
            <div className="board-item-list-empty">
                No items in this list yet.
            </div>
        );

    return <div className="board-item-list">{itemsDOM}</div>;
};
