import { orderBy } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import { BoardCreateUpdateModal } from 'components/BoardCreateUpdateModal/BoardCreateUpdateModal';
import { BoardExpandableHeader } from 'components/BoardExpandableList/BoardExpandableHeader';
import { BoardExpandableSection } from 'components/BoardExpandableList/BoardExpandableSection';
import {
    BoardOrderBy,
    BoardOrderToDescription,
    BoardOrderToTitle,
} from 'const/board';
import { IDataDoc } from 'const/datadoc';
import { getEnumEntries } from 'lib/typescript';
import { addBoardItem, fetchBoards } from 'redux/board/action';
import { myBoardsSelector } from 'redux/board/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { Icon } from 'ui/Icon/Icon';
import { Level, LevelItem } from 'ui/Level/Level';
import { OrderByButton } from 'ui/OrderByButton/OrderByButton';
import { Title } from 'ui/Title/Title';

import {
    BoardDraggableType,
    DataDocDraggableType,
    IProcessedBoardItem,
} from './navigatorConst';

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
    const match = useRouteMatch('/:env/:ignore(list)?/:matchBoardId?');
    const { matchBoardId } = match?.params ?? {};
    const selectedBoardId = useMemo(
        () => (matchBoardId ? Number(matchBoardId) : null),
        [matchBoardId]
    );

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

    const boardsDOM = collapsed ? null : (
        <div className="ml8">
            <div className="BoardExpandableSection">
                <BoardExpandableHeader
                    boardId={0}
                    boardName="All Public Lists"
                    collapsed={false}
                    toggleCollapsed={() => null}
                    isEditable={false}
                    isCollapsable={false}
                />
            </div>
            {boards.map((board) => (
                <BoardExpandableSection
                    key={board.id}
                    id={board.id}
                    selectedDocId={selectedDocId}
                    selectedBoardId={selectedBoardId}
                    filterString={filterString}
                    onMoveBoardItem={handleMoveBoardItem}
                />
            ))}
        </div>
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
