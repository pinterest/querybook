import * as React from 'react';

import { IComment } from 'const/comment';
import { StyledText } from 'ui/StyledText/StyledText';

import { OpenThreadComment } from './OpenThreadComment';

interface IProps {
    comment: IComment;
    renderFlatCommentDOM: (
        comment: IComment,
        parentCommentId?: number
    ) => JSX.Element;
    isOpen: boolean;
    openThread: () => void;
}

export const ThreadComment: React.FunctionComponent<IProps> = ({
    comment,
    renderFlatCommentDOM,
    isOpen,
    openThread,
}) => (
    <div className="CommentThread mt16 mb12" onClick={openThread}>
        {isOpen ? (
            <OpenThreadComment
                childCommentIds={comment.child_comment_ids}
                parentCommentId={comment.id}
                renderFlatCommentDOM={renderFlatCommentDOM}
            />
        ) : (
            <div className="ClosedCommentThread flex-row">
                <StyledText
                    className="ThreadCount mr8"
                    size="xsmall"
                    color="accent"
                    cursor="default"
                >
                    {comment.child_comment_ids?.length}{' '}
                    {comment.child_comment_ids?.length === 1
                        ? 'Reply'
                        : 'Replies'}
                </StyledText>
                <span className="HoverText">
                    <StyledText size="xsmall" color="lightest" cursor="pointer">
                        View Thread
                    </StyledText>
                </span>
            </div>
        )}
    </div>
);
