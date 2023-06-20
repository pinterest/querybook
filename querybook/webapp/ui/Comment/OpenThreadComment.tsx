import * as React from 'react';
import { useDispatch } from 'react-redux';

import { IComment } from 'const/comment';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { fetchChildCommentsByParentCommentIdIfNeeded } from 'redux/comment/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { StyledText } from 'ui/StyledText/StyledText';

interface IProps {
    parentCommentId: number;
    childCommentIds: number[];
    renderFlatCommentDOM: (comment: IComment, isChild: boolean) => JSX.Element;
}

export function useFetchChildCommentsByParentCommentId(
    parentCommentId: number,
    childCommentIds: number[]
) {
    const [loading, setLoading] = React.useState(false);
    const dispatch: Dispatch = useDispatch();
    const commentsById = useShallowSelector(
        (state: IStoreState) => state.comment.commentsById
    );
    React.useEffect(() => {
        setLoading(true);
        dispatch(
            fetchChildCommentsByParentCommentIdIfNeeded(
                parentCommentId,
                childCommentIds
            )
        ).finally(() => {
            setLoading(false);
        });
    }, [dispatch, childCommentIds, parentCommentId]);

    return {
        loading,
        commentsById,
    };
}

export const OpenThreadComment: React.FunctionComponent<IProps> = ({
    parentCommentId,
    childCommentIds,
    renderFlatCommentDOM,
}) => {
    const { loading, commentsById } = useFetchChildCommentsByParentCommentId(
        parentCommentId,
        childCommentIds
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
        <>
            {loading
                ? loadingCommentDOM
                : childCommentIds.map((commentId) =>
                      renderFlatCommentDOM(commentsById[commentId], true)
                  )}
        </>
    );
};
