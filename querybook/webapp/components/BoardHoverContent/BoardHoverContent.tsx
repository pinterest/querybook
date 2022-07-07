import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { UserBadge } from 'components/UserBadge/UserBadge';
import { useMakeSelector } from 'hooks/redux/useMakeSelector';
import { generateFormattedDate } from 'lib/utils/datetime';
import { fetchBoardIfNeeded } from 'redux/board/action';
import { makeBoardItemsSelector } from 'redux/board/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Icon } from 'ui/Icon/Icon';
import { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { Loader } from 'ui/Loader/Loader';
import { StyledText } from 'ui/StyledText/StyledText';
import { Tag } from 'ui/Tag/Tag';
import { Title } from 'ui/Title/Title';

export const BoardHoverContent: React.FC<{
    boardId: number;
    title: string;
}> = ({ boardId, title }) => {
    const dispatch: Dispatch = useDispatch();

    const board = useSelector(
        (state: IStoreState) => state.board.boardById[boardId]
    );
    const items = useMakeSelector(makeBoardItemsSelector, boardId);

    const getBoard = React.useCallback(() => {
        dispatch(fetchBoardIfNeeded(boardId));
    }, [boardId]);

    const itemIconNameToCount = React.useMemo(() => {
        let docCount = 0;
        let tableCount = 0;
        let boardCount = 0;
        let executionCount = 0;
        Object.values(items).forEach(({ boardItem }) => {
            if (boardItem.data_doc_id != null) {
                docCount++;
            } else if (boardItem.table_id != null) {
                tableCount++;
            } else if (boardItem.board_id != null) {
                boardCount++;
            } else {
                executionCount++;
            }
        });
        return {
            File: docCount,
            Database: tableCount,
            Briefcase: boardCount,
            PlayCircle: executionCount,
        };
    }, [items]);

    const renderBoardView = () => {
        const { owner_uid: ownerUid, updated_at: updatedAt } = board;
        const updatedAtDate = generateFormattedDate(updatedAt);

        return (
            <>
                <UserBadge uid={ownerUid} mini />
                <div className="flex-row mt4">
                    {Object.entries(itemIconNameToCount).map(([key, count]) =>
                        count ? (
                            <Tag className="flex-row mr8" key={key} mini light>
                                <Icon
                                    size={16}
                                    name={key as AllLucideIconNames}
                                    className="mr8"
                                />
                                <StyledText size="xsmall">{count}</StyledText>
                            </Tag>
                        ) : null
                    )}
                </div>
                <StyledText
                    size="xsmall"
                    className="BoardHoverContent-date mt4"
                >
                    Updated {updatedAtDate}
                </StyledText>
            </>
        );
    };

    return (
        <div className="BoardHoverContent">
            <Title className="mb4" size="smedium">
                {title}
            </Title>
            <Loader
                item={board}
                itemKey={boardId}
                itemLoader={getBoard}
                renderer={renderBoardView}
            />
        </div>
    );
};
