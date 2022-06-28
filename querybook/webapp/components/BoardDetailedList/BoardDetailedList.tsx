import { stateFromHTML } from 'draft-js-import-html';
import React from 'react';

import { generateFormattedDate } from 'lib/utils/datetime';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { IBoardBase } from 'const/board';
import { useUser } from 'hooks/redux/useUser';

import { UserAvatar } from 'components/UserBadge/UserAvatar';

import { LoadingRow } from 'ui/Loading/Loading';
import { Link } from 'ui/Link/Link';
import { AccentText, StyledText } from 'ui/StyledText/StyledText';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';

import './BoardDetailedList.scss';

export interface IBoardDetailedListProps {
    boards: IBoardBase[];
}

const BoardListItem: React.FunctionComponent<{
    board: IBoardBase;
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
            <div className="BoardListItem flex-center">
                <LoadingRow />
            </div>
        );
    }

    return (
        <div className="BoardListItem">
            <div className="BoardListItem-top horizontal-space-between">
                <Link to={getWithinEnvUrl(`/list/${id}`)}>
                    <AccentText size="smedium" weight="bold" color="text" hover>
                        {name}
                    </AccentText>
                </Link>
                <StyledText size="small" color="lightest">
                    {generateFormattedDate(createdAt, 'X')}
                </StyledText>
            </div>
            <span className="flex-row mt4">
                <UserAvatar uid={ownerUid} tiny />
                {ownerInfo.username}
            </span>
            <div className="BoardListItem-description mv8">
                {stateFromHTML(description).getPlainText().length ? (
                    <RichTextEditor
                        value={stateFromHTML(description)}
                        readOnly
                    />
                ) : (
                    <AccentText
                        className="mt8"
                        noUserSelect
                        color="lightest"
                        size="small"
                    >
                        No list description
                    </AccentText>
                )}
            </div>
        </div>
    );
};

export const BoardDetailedList: React.FunctionComponent<
    IBoardDetailedListProps
> = ({ boards }) => (
    <div className="BoardDetailedList">
        {boards.map((board) => (
            <BoardListItem board={board} key={board.id} />
        ))}
    </div>
);
