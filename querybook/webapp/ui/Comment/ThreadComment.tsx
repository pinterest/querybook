import * as React from 'react';
import { useDispatch } from 'react-redux';

import { IComment } from 'const/comment';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { fetchChildCommentsByParentCommentIdIfNeeded } from 'redux/comment/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { StyledText } from 'ui/StyledText/StyledText';

interface IProps {
    comment: IComment;
    renderFlatCommentDOM: (comment: IComment, isChild: boolean) => JSX.Element;
}

export const ThreadComment: React.FunctionComponent<IProps> = ({
    comment,
    renderFlatCommentDOM,
}) => {
    const dispatch: Dispatch = useDispatch();

    const commentsById = useShallowSelector(
        (state: IStoreState) => state.comment.commentsById
    );

    const [openThreadIds, setOpenThreadIds] = React.useState<Set<number>>(
        new Set()
    );

    const handleOpenThread = React.useCallback(
        (parentCommentId: number, childCommentIds: number[] = []) => {
            dispatch(
                fetchChildCommentsByParentCommentIdIfNeeded(
                    parentCommentId,
                    childCommentIds
                )
            );
            setOpenThreadIds((curr) => new Set([...curr, parentCommentId]));
        },
        [dispatch]
    );
    const loadingCommentDOM = React.useMemo(
        () => (
            <div className="Comment mv8">
                <StyledText
                    size="xsmall"
                    color="lightest"
                    cursor="default"
                    isItalic
                >
                    Loading Comment
                </StyledText>
            </div>
        ),
        []
    );

    return (
        <div
            className="CommentThread mt16 mb12"
            onClick={() =>
                handleOpenThread(comment.id, comment.child_comment_ids)
            }
        >
            {openThreadIds.has(comment.id) ? (
                comment.child_comment_ids?.map((commentId) =>
                    commentsById[commentId]
                        ? renderFlatCommentDOM(commentsById[commentId], true)
                        : loadingCommentDOM
                )
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
