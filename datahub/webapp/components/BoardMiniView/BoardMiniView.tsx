import React, { useEffect, useState } from 'react';
import { Dispatch, IStoreState } from 'redux/store/types';
import { useDispatch, useSelector } from 'react-redux';

import {
    fetchBoardIfNeeded,
    deleteBoard,
    deleteBoardItem,
} from 'redux/board/action';
import { sendConfirm, sendNotification } from 'lib/dataHubUI';
import { Loading } from 'ui/Loading/Loading';
import { Title } from 'ui/Title/Title';
import { Divider } from 'ui/Divider/Divider';

import { IconButton } from 'ui/Button/IconButton';
import { Level, LevelItem } from 'ui/Level/Level';
import { BoardCreateUpdateModal } from 'components/BoardCreateUpdateModal/BoardCreateUpdateModal';
import { SeeMoreText } from 'ui/SeeMoreText/SeeMoreText';

import './BoardMiniView.scss';
import { BoardItemType } from 'const/board';
import { boardDataDocSelector, boardTableSelector } from 'redux/board/selector';
import { IDataDoc, emptyDataDocTitleMessage } from 'const/datadoc';
import { IDataTable } from 'const/metastore';
import { Icon } from 'ui/Icon/Icon';
import { navigateWithinEnv } from 'lib/utils/query-string';

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
    const boardItems = useSelector(
        (state: IStoreState) => state.board.boardIdToItemsId[id]
    );

    const handleDeleteBoardItem = React.useCallback(
        async (boardId: number, itemId: number, itemType: BoardItemType) => {
            await dispatch(deleteBoardItem(boardId, itemType, itemId));
            // TODO: Consider not duplicatiing this logic in BoardItemAddButton
            sendNotification(`Item removed from the list "${board.name}"`);
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
                    title="Docs"
                    boardId={id}
                    itemType={'data_doc'}
                    expandOnMount={true}
                    onDeleteBoardItem={handleDeleteBoardItem}
                />
                <BoardExpandableList
                    title="Tables"
                    boardId={id}
                    itemType={'table'}
                    expandOnMount={true}
                    onDeleteBoardItem={handleDeleteBoardItem}
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
    title: string;
    boardId: number;
    itemType: BoardItemType;
    expandOnMount: boolean;
    onDeleteBoardItem: (
        boardId: number,
        itemId: number,
        itemType: BoardItemType
    ) => any;
}> = ({
    title,
    boardId,
    itemType,
    expandOnMount = true,
    onDeleteBoardItem,
}) => {
    const items = useSelector((state: IStoreState) =>
        itemType === 'data_doc'
            ? boardDataDocSelector(state, boardId)
            : boardTableSelector(state, boardId)
    );
    const [expand, setExpand] = useState(expandOnMount);

    // cast any[] since strange Typescript issue that errors when using map on union array
    const itemsDOM =
        expand &&
        (items.length > 0 ? (
            (items as any[]).map((item: IDataDoc | IDataTable) => {
                let key: string;
                let itemNameDOM: React.ReactElement;
                let onItemClick: () => any;
                if (itemType === 'data_doc') {
                    const doc = item as IDataDoc;
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
                    const table = item as IDataTable;
                    key = `table-${table.id}`;
                    itemNameDOM = (
                        <>
                            <Icon name="book" size={16} />
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
                                onDeleteBoardItem(boardId, item.id, itemType);
                            }}
                        />
                    </Level>
                );
            })
        ) : (
            <div className="board-item-list-empty">
                No items in this list yet.
            </div>
        ));

    return (
        <div className="board-item-list">
            <Level
                className="board-item-list-header flex-row"
                onClick={() => setExpand(!expand)}
            >
                {title}
                <Icon
                    name={expand ? 'chevron-down' : 'chevron-right'}
                    size={16}
                />
            </Level>
            {itemsDOM}
        </div>
    );
};
