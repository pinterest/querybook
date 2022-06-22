import { BoardViewersList } from 'components/BoardViewersList/BoardViewersList';
import * as React from 'react';

import { Button } from 'ui/Button/Button';
import { Popover } from 'ui/Popover/Popover';

import './BoardViewersBadge.scss';

interface IProps {
    boardId: number;
    isPublic: boolean;
}

export const BoardViewersBadge: React.FunctionComponent<IProps> = ({
    boardId,
    isPublic,
}) => {
    const [showViewsList, setShowViewsList] = React.useState(false);
    const selfRef = React.useRef<HTMLDivElement>();

    return (
        <div className="BoardViewersBadge" ref={selfRef}>
            <Button
                className="viewers-badge-share-button"
                icon={isPublic ? 'Users' : 'Lock'}
                title="Share"
                pushable
                data-balloon-pos="left"
                onClick={() => setShowViewsList((v) => !v)}
            />
            {showViewsList && (
                <Popover
                    anchor={selfRef.current}
                    onHide={() => setShowViewsList(false)}
                    layout={['bottom', 'right']}
                    resizeOnChange
                >
                    <BoardViewersList boardId={boardId} />
                </Popover>
            )}
        </div>
    );
};
