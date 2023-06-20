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
}

export const Comment: React.FunctionComponent<IProps> = ({
    comment,
    editComment,
    isBeingEdited,
    isBeingRepliedTo,
    isChild,
    createChildComment,
}) => {
    const userInfo = useSelector((state: IStoreState) => state.user.myUserInfo);
    const {
        id,
        text,
        created_by: uid,
        created_at: createdAt,
        updated_at: updatedAt,
        reactions,
    } = comment;

    return (
        <div className="Comment">
            <div className="Comment-top horizontal-space-between">
                <div className="Comment-top-left flex-row">
                    <UserAvatar uid={uid} tiny />
                    <UserName uid={uid} />
                    <StyledText size="xsmall" color="lightest" cursor="default">
                        {fromNow(createdAt)}
                    </StyledText>
                    {createdAt === updatedAt ? null : (
                        <StyledText
                            size="xsmall"
                            color="lightest-0"
                            cursor="default"
                            isItalic
                        >
                            updated {fromNow(updatedAt)}
                        </StyledText>
                    )}
                </div>
                <div className="Comment-top-right flex-row">
                    {isBeingEdited ? (
                        <StyledText
                            className="mr4"
                            color="accent"
                            weight="bold"
                            isItalic
                            cursor="default"
                        >
                            editing
                        </StyledText>
                    ) : null}
                    {isBeingRepliedTo ? (
                        <StyledText
                            className="mr4"
                            color="accent"
                            weight="bold"
                            isItalic
                            cursor="default"
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
                            <div className="ml8">
                                <IconButton
                                    icon="MessageCircle"
                                    invertCircle
                                    size={18}
                                    tooltip="Reply to comment"
                                    tooltipPos="left"
                                    onClick={createChildComment}
                                />
                            </div>
                        )}
                        <div className="mh8">
                            <AddReactionButton commentId={id} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="Comment-text mt4">
                <RichTextEditor value={text} readOnly={true} />
                {reactions.length ? (
                    <Reactions reactions={reactions} commentId={id} />
                ) : null}
            </div>
        </div>
    );
};
