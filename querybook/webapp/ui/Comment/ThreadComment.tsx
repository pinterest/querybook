import * as React from 'react';

import { IComment } from 'const/comment';
import { StyledText } from 'ui/StyledText/StyledText';

import { OpenThreadComment } from './OpenThreadComment';

interface IProps {
    comment: IComment;
    renderFlatCommentDOM: (comment: IComment, isChild: boolean) => JSX.Element;
}

export const ThreadComment: React.FunctionComponent<IProps> = ({
    comment,
    renderFlatCommentDOM,
}) => {
    const [openThreadIds, setOpenThreadIds] = React.useState<Set<number>>(
        new Set()
    );

    const handleOpenThread = React.useCallback((parentCommentId: number) => {
        setOpenThreadIds((curr) => new Set([...curr, parentCommentId]));
    }, []);

    return (
        <div
            className="CommentThread mt16 mb12"
            onClick={() => handleOpenThread(comment.id)}
        >
            {openThreadIds.has(comment.id) ? (
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
                        <StyledText
                            size="xsmall"
                            color="lightest"
                            cursor="pointer"
                        >
                            View Thread
                        </StyledText>
                    </span>
                </div>
            )}
        </div>
    );
};
