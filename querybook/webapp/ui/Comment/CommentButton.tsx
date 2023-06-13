import * as React from 'react';

import { CommentEntityType } from 'const/comment';
import { SoftButton } from 'ui/Button/Button';
import { Popover } from 'ui/Popover/Popover';

import { Comments } from './Comments';

interface IProps {
    entityType: CommentEntityType;
    entityId: number;
}

export const CommentButton: React.FunctionComponent<IProps> = ({
    entityType,
    entityId,
}) => {
    const [showComments, setShowComments] = React.useState(false);
    const commentButtonRef = React.useRef<HTMLAnchorElement>();
    return (
        <>
            <SoftButton
                key={'button' + entityType + entityId}
                className="block-crud-button"
                onClick={() => setShowComments((curr) => !curr)}
                icon="MessageSquare"
                aria-label="Comments"
                data-balloon-pos="left"
                ref={commentButtonRef}
            />
            {showComments ? (
                <Popover
                    key={'popover' + entityType + entityId}
                    onHide={() => setShowComments(false)}
                    anchor={commentButtonRef.current}
                    layout={['bottom', 'right']}
                    hideArrow
                    noPadding
                >
                    <Comments
                        key={'comment' + entityType + entityId}
                        entityType={entityType}
                        entityId={entityId}
                    />
                </Popover>
            ) : null}
        </>
    );
};
