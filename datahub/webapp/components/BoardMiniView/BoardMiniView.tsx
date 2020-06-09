import React, { useEffect, useState } from 'react';
import { Dispatch, IStoreState } from 'redux/store/types';
import { useDispatch, useSelector } from 'react-redux';

import { BoardCreateUpdateModal } from 'components/BoardCreateUpdateModal/BoardCreateUpdateModal';
import { BoardItemType } from 'const/board';
import { IDataDoc, emptyDataDocTitleMessage } from 'const/datadoc';
import { IDataTable } from 'const/metastore';

import { navigateWithinEnv } from 'lib/utils/query-string';
import { sendConfirm, sendNotification } from 'lib/dataHubUI';

import { boardItemsSelector } from 'redux/board/selector';
import {
    fetchBoardIfNeeded,
    deleteBoard,
    deleteBoardItem,
    moveBoardItem,
} from 'redux/board/action';
<<<<<<< HEAD
import { boardDataDocSelector, boardTableSelector } from 'redux/board/selector';
import { sendConfirm, sendNotification } from 'lib/dataHubUI';
import { IDataDoc, emptyDataDocTitleMessage } from 'const/datadoc';
import { IDataTable } from 'const/metastore';
import { BoardItemType } from 'const/board';
import { navigateWithinEnv } from 'lib/utils/query-string';

import { BoardCreateUpdateModal } from 'components/BoardCreateUpdateModal/BoardCreateUpdateModal';

import { Divider } from 'ui/Divider/Divider';
import { Icon } from 'ui/Icon/Icon';
import { IconButton } from 'ui/Button/IconButton';
import { Level, LevelItem } from 'ui/Level/Level';
import { Loading } from 'ui/Loading/Loading';
import { SeeMoreText } from 'ui/SeeMoreText/SeeMoreText';
import { Title } from 'ui/Title/Title';

=======

import { SeeMoreText } from 'ui/SeeMoreText/SeeMoreText';
import { Icon } from 'ui/Icon/Icon';
import { DraggableList } from 'ui/DraggableList/DraggableList';
import { IconButton } from 'ui/Button/IconButton';
import { Level, LevelItem } from 'ui/Level/Level';
import { Loading } from 'ui/Loading/Loading';
import { Title } from 'ui/Title/Title';
import { Divider } from 'ui/Divider/Divider';
>>>>>>> Add drag and drop for table of contents and board
import './BoardMiniView.scss';

interface IProps {
    id: number;
    onHide?: () => any;
}
export const BoardMiniView: React.FunctionComponent<IProps> = ({
    id,
    onHide,
}) => {
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
        dispatch(fetchBoardIfNeeded(id));
    }, [id]);

    if (!board && !boardItems) {
        return <Loading />;
    }

    return (
        <div className="BoardMiniView">
            <div className="board-header">
                <Level>
                    {onHide ? (
                        <IconButton icon="x" onClick={onHide} noPadding />
                    ) : (
                        <span />
                    )}
                    <LevelItem className="board-header-controls">
                        <IconButton
                            icon="trash"
                            onClick={() =>
                                sendConfirm({
                                    onConfirm: () => {
                                        dispatch(deleteBoard(id));
                                        if (onHide) {
                                            onHide();
                                        }
                                    },
                                    message:
                                        'Your list will be permanently removed.',
                                })
                            }
                            noPadding
                            className="mr4"
                        />
                        <IconButton
                            icon="edit-3"
                            onClick={() => setShowUpdateModal(true)}
                            noPadding
                        />
                    </LevelItem>
                </Level>
            </div>
            <div className="BoardMiniView-top mt8 mh12 mb4">
                <Title className="one-line-ellipsis" size={5}>
                    {board.name}
                </Title>
                <p>
                    <SeeMoreText text={board.description} />
                </p>
            </div>
            <Divider
                marginTop={'2px'}
                marginBottom={'2px'}
                height={'1px'}
                color={'var(--border-color)'}
            />
            <div className="board-item-lists">
                <BoardExpandableList
                    boardId={id}
                    itemType={'table'}
                    onDeleteBoardItem={handleDeleteBoardItem}
                    onMoveBoardItem={handleMoveBoardItem}
                />
            </div>

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
    itemType: BoardItemType;
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
                                icon="trash"
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
