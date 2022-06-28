import { stateFromHTML } from 'draft-js-import-html';
import React from 'react';

import { AccentText, StyledText } from 'ui/StyledText/StyledText';
import { IBoard } from 'const/board';
import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { useUser } from 'hooks/redux/useUser';
import { LoadingRow } from 'ui/Loading/Loading';
import { Level } from 'ui/Level/Level';
import { generateFormattedDate } from 'lib/utils/datetime';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { Link } from 'ui/Link/Link';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';

import './BoardDetailedList.scss';

export interface IBoardDetailedListProps {
    boards: IBoard[];
}

const BoardListItem: React.FunctionComponent<{
    board: IBoard;
}> = ({ board }) => {
    const {
        created_at: createdAt,
        description,
        id,
        name,
        owner_uid: ownerUid,
    } = board;
    const { userInfo: ownerInfo, loading } = useUser({ uid: ownerUid });

    if (loading) {
        return (
            <div className="Board flex-center">
                <LoadingRow />
            </div>
        );
    }

    return (
        <div className="Board">
            <Link to={getWithinEnvUrl(`/list/${id}`)}>
                <AccentText size="smedium" weight="bold" color="text" hover>
                    {name}
                </AccentText>
            </Link>
            <div className="Board-description mv8">
                {stateFromHTML(description).getPlainText().length ? (
                    <RichTextEditor
                        value={stateFromHTML(description)}
                        readOnly
                    />
                ) : (
                    'no description'
                )}
            </div>
            <Level className="Board-bottom">
                <span className="Board-owner-info">
                    <UserAvatar className="mr4" uid={ownerUid} tiny />
                    {ownerInfo.username}
                </span>
                <StyledText size="small" color="lightest">
                    {generateFormattedDate(createdAt, 'X')}
                </StyledText>
            </Level>
        </div>
    );
};

export const BoardDetailedList: React.FunctionComponent<
    IBoardDetailedListProps
> = ({ boards }) => {
    return (
        <div className="BoardDetailedList">
            {boards.map((board) => (
                <BoardListItem board={board} key={board.id} />
            ))}
        </div>
    );
};
