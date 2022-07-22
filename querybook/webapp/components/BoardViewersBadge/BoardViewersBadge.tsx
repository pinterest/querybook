import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { BoardViewersList } from 'components/BoardViewersList/BoardViewersList';
import { fetchBoardAccessRequests } from 'redux/board/action';
import { currentBoardAccessRequestsByUidSelector } from 'redux/board/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Button } from 'ui/Button/Button';
import { Popover } from 'ui/Popover/Popover';

import './BoardViewersBadge.scss';

interface IProps {
    boardId: number;
    isPublic: boolean;
    isEditable: boolean;
}

export const BoardViewersBadge: React.FunctionComponent<IProps> = ({
    boardId,
    isPublic,
    isEditable,
}) => {
    const dispatch: Dispatch = useDispatch();
    const [showViewsList, setShowViewsList] = React.useState(false);
    const selfRef = React.useRef<HTMLDivElement>();

    const accessRequestsByUid = useSelector((state: IStoreState) =>
        currentBoardAccessRequestsByUidSelector(state, boardId)
    );
    const accessRequestsByUidLength = Object.keys(accessRequestsByUid).length;

    React.useEffect(() => {
        dispatch(fetchBoardAccessRequests(boardId));
    }, [dispatch, boardId]);

    return (
        <div className="BoardViewersBadge" ref={selfRef}>
            <Button
                className="viewers-badge-share-button"
                icon={isPublic ? 'Users' : 'Lock'}
                title="Share"
                pushable
                ping={
                    isEditable && accessRequestsByUidLength > 0
                        ? accessRequestsByUidLength.toString()
                        : null
                }
                aria-label={
                    isEditable && accessRequestsByUidLength > 0
                        ? `${accessRequestsByUidLength} Access Request${
                              accessRequestsByUidLength === 1 ? '' : 's'
                          }`
                        : null
                }
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
                    <BoardViewersList
                        boardId={boardId}
                        isEditable={isEditable}
                    />
                </Popover>
            )}
        </div>
    );
};
