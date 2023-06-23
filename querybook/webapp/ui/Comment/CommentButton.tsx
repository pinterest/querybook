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
    const selfRef = React.useRef<HTMLAnchorElement>(null);

    return (
        <>
            <SoftButton
                className="block-crud-button"
                onClick={() => setShowComments((curr) => !curr)}
                icon="MessageSquare"
                aria-label="Comments"
                data-balloon-pos="left"
                ref={selfRef}
            />
            {showComments ? (
                <Popover
                    onHide={() => setShowComments(false)}
                    anchor={selfRef.current}
                    layout={['bottom', 'right']}
                    hideArrow
                    noPadding
                >
                    <Comments entityType={entityType} entityId={entityId} />
                </Popover>
            ) : null}
        </>
    );
};
