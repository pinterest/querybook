import * as React from 'react';

import { SoftButton } from 'ui/Button/Button';
import { Popover } from 'ui/Popover/Popover';

import { Comments } from './Comments';

export const CommentButton: React.FunctionComponent = () => {
    const [showComments, setShowComments] = React.useState(false);
    const commentButtonRef = React.useRef<HTMLAnchorElement>();
    return (
        <>
            <SoftButton
                className="block-crud-button"
                onClick={() => setShowComments((curr) => !curr)}
                icon="MessageSquare"
                aria-label="Comments"
                data-balloon-pos="left"
                ref={commentButtonRef}
            />
            {showComments ? (
                <Popover
                    onHide={() => setShowComments(false)}
                    anchor={commentButtonRef.current}
                    layout={['bottom', 'right']}
                    hideArrow
                    noPadding
                >
                    <Comments />
                </Popover>
            ) : null}
        </>
    );
};
