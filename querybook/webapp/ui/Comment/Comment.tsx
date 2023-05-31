import * as DraftJs from 'draft-js';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { UserName } from 'components/UserBadge/UserName';
import { fromNow } from 'lib/utils/datetime';
import { IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';
import { StyledText } from 'ui/StyledText/StyledText';

import { AddReactionButton } from './AddReactionButton';
import { IReaction } from './Comments';
import { Reactions } from './Reactions';

interface IProps {
    text: DraftJs.ContentState;
    uid: number;
    createdAt: number;
    reactions: IReaction[];
    editComment: () => void;
}

export const Comment: React.FunctionComponent<IProps> = ({
    text,
    uid,
    createdAt,
    reactions,
    editComment,
}) => {
    const userInfo = useSelector((state: IStoreState) => state.user.myUserInfo);

    return (
        <div className="Comment">
            <div className="Comment-top horizontal-space-between">
                <div className="Comment-top-left flex-row">
                    <UserAvatar uid={uid} tiny />
                    <UserName uid={uid} />
                    <StyledText size="xsmall" color="lightest" cursor="default">
                        {fromNow(createdAt)}
                    </StyledText>
                </div>
                <div className="Comment-top-right flex-row">
                    {uid === userInfo.uid ? (
                        <div className="Comment-edit">
                            <IconButton
                                icon="Edit"
                                invertCircle
                                size={18}
                                tooltip="Edit Comment"
                                tooltipPos="left"
                                onClick={editComment}
                            />
                        </div>
                    ) : null}
                    <div className="mh8">
                        <AddReactionButton uid={userInfo.uid} />
                    </div>
                </div>
            </div>
            <div className="Comment-text mt4">
                <RichTextEditor value={text} readOnly={true} />
                {reactions.length ? <Reactions reactions={reactions} /> : null}
            </div>
        </div>
    );
};
