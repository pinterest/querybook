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
import { EmptyText } from 'ui/StyledText/StyledText';

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

    const filteredBoards = useMemo(() => {
        const filterStrLower = filterStr.toLowerCase();
        return boards
            .filter(
                (board) =>
                    filterStrLower === '' ||
                    board.name.toLowerCase().includes(filterStrLower)
            )
            .map((board) => ({
                ...board,
                selected: selectedBoardIds.includes(board.id),
            }));
    }, [filterStr, boards, selectedBoardIds]);
    const boardRowRenderer = React.useCallback(
        (board: IBoard & { selected: boolean }) => {
            const { name, selected } = board;
            const className = clsx({
                selected,
            });
            const selectedIcon = selected ? 'CheckCircle' : 'Circle';

            return (
                <ListLink
                    className={className}
                    onClick={() => onBoardClick(board)}
                    isRow
                    icon={selectedIcon}
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
            <EmptyText className="m24">No list found</EmptyText>
        );

    return (
        <div className="BoardList">
            <div className="BoardList-header flex-row mb8">
                <SearchBar
                    value={filterStr}
                    onSearch={setFilterStr}
                    placeholder="Filter list"
                    className="mr12"
                />
                <IconButton
                    icon="Plus"
                    tooltip={'New List'}
                    tooltipPos={'left'}
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
