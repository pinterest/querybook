import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import clsx from 'clsx';

import { IBoard } from 'const/board';
import { fetchBoards } from 'redux/board/action';
import { myBoardsSelector } from 'redux/board/selector';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { IconButton } from 'ui/Button/IconButton';
import { BoardCreateUpdateModal } from 'components/BoardCreateUpdateModal/BoardCreateUpdateModal';
import { InfinityScroll } from 'ui/InfinityScroll/InfinityScroll';
import { ListLink } from 'ui/Link/ListLink';
import './BoardList.scss';

interface IProps {
    onBoardClick: (id: IBoard) => any;
    onCreateBoardClick?: () => any;
    selectedBoardIds: number[];
}

export const BoardList: React.FunctionComponent<IProps> = ({
    onBoardClick,
    selectedBoardIds,
    onCreateBoardClick,
}) => {
    const [showCreateModal, setCreateModal] = useState(false);
    const [filterStr, setFilterStr] = useState('');
    const dispatch = useDispatch();
    const boards = useSelector(myBoardsSelector);
    useEffect(() => {
        dispatch(fetchBoards());
    }, []);

    const filteredBoards = useMemo(
        () =>
            boards
                .filter(
                    (board) =>
                        filterStr === '' || board.name.includes(filterStr)
                )
                .map((board) => ({
                    ...board,
                    selected: selectedBoardIds.includes(board.id),
                })),
        [filterStr, boards, selectedBoardIds]
    );
    const boardRowRenderer = React.useCallback(
        (board: IBoard & { selected: boolean }) => {
            const { name, public: publicBoard, selected } = board;
            const className = clsx({
                selected,
            });
            const publicIcon = publicBoard && 'users';

            return (
                <ListLink
                    className={className}
                    onClick={() => onBoardClick(board)}
                    isRow
                    icon={publicIcon}
                    title={name}
                />
            );
        },
        [onBoardClick]
    );

    const boardsDOM =
        filteredBoards.length > 0 ? (
            <div className="board-scroll-wrapper">
                <InfinityScroll<IBoard>
                    elements={filteredBoards}
                    hasMore={false}
                    itemRenderer={boardRowRenderer}
                    itemHeight={28}
                />
            </div>
        ) : (
            <div className="empty-message">No list found.</div>
        );

    return (
        <div className="BoardList">
            <div className="list-header flex-row">
                <SearchBar
                    value={filterStr}
                    onSearch={setFilterStr}
                    placeholder="Filter..."
                    transparent
                />
                <IconButton
                    icon="plus"
                    tooltip={'New List'}
                    tooltipPos={'right'}
                    onClick={
                        onCreateBoardClick
                            ? onCreateBoardClick
                            : () => setCreateModal(true)
                    }
                    noPadding
                />
            </div>
            {boardsDOM}
            {showCreateModal ? (
                <BoardCreateUpdateModal
                    onComplete={() => setCreateModal(false)}
                    onHide={() => setCreateModal(false)}
                />
            ) : null}
        </div>
    );
};
