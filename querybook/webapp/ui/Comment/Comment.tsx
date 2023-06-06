import * as DraftJS from 'draft-js';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { UserName } from 'components/UserBadge/UserName';
import { IComment } from 'const/comment';
import { fromNow } from 'lib/utils/datetime';
import { IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';
import { StyledText } from 'ui/StyledText/StyledText';

import { AddReactionButton } from './AddReactionButton';
import { Reactions } from './Reactions';

interface IProps {
    comment: IComment;
    editComment: (text: DraftJS.ContentState) => void;
    isBeingEdited: boolean;
    isBeingRepliedTo: boolean;
    isChild: boolean;
    createChildComment: () => void;

    cellId?: number;
    tableId?: number;
}

export const Comment: React.FunctionComponent<IProps> = ({
    comment,
    editComment,
    isBeingEdited,
    isBeingRepliedTo,
    isChild,
    createChildComment,
    cellId,
    tableId,
}) => {
    const userInfo = useSelector((state: IStoreState) => state.user.myUserInfo);
    const { id, text, uid, created_at: createdAt, reactions } = comment;

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
                    {isBeingEdited ? (
                        <StyledText
                            className="Editing-text mr4"
                            color="accent"
                            weight="bold"
                        >
                            editing
                        </StyledText>
                    ) : null}
                    {isBeingRepliedTo ? (
                        <StyledText
                            className="Editing-text mr4"
                            color="accent"
                            weight="bold"
                        >
                            replying to
                        </StyledText>
                    ) : null}
                    <div className="Comment-top-right-buttons flex-row">
                        {uid === userInfo.uid && !isBeingEdited ? (
                            <div className="Comment-edit">
                                <IconButton
                                    icon="Edit"
                                    invertCircle
                                    size={18}
                                    tooltip="Edit Comment"
                                    tooltipPos="left"
                                    onClick={() => editComment(text)}
                                />
                            </div>
                        ) : null}
                        {isChild ? null : (
                            <IconButton
                                icon="MessageCircle"
                                invertCircle
                                size={18}
                                tooltip="Reply to comment"
                                tooltipPos="left"
                                onClick={createChildComment}
                            />
                        )}
                        <div className="mh8">
                            <AddReactionButton
                                commentId={id}
                                cellId={cellId}
                                tableId={tableId}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="Comment-text mt4">
                <RichTextEditor value={text} readOnly={true} />
                {reactions.length ? (
                    <Reactions
                        reactions={reactions}
                        commentId={id}
                        cellId={cellId}
                        tableId={tableId}
                    />
                ) : null}
            </div>
        </div>
    );
};
