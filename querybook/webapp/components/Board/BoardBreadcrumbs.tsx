import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useBoardPath } from 'hooks/ui/useBoardPath';
import { fetchBoardIfNeeded } from 'redux/board/action';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Link } from 'ui/Link/Link';

function useBoardById(boardPath: number[]) {
    const boardById = useSelector(
        (state: IStoreState) => state.board.boardById
    );
    const dispatch: Dispatch = useDispatch();

    React.useEffect(() => {
        for (const boardId of boardPath) {
            dispatch(fetchBoardIfNeeded(boardId));
        }
    }, [dispatch, boardPath]);

    return boardById;
}

export const BoardBreadcrumbs: React.FC = () => {
    const boardPath = useBoardPath();
    const boardById = useBoardById(boardPath);
    const environment = useSelector(currentEnvironmentSelector);

    const nestedBoardPathAcc = [environment.name, 'list'];
    const nestedBoardPathDOM = boardPath.map((boardId) => {
        nestedBoardPathAcc.push(String(boardId));
        const boardUrl = '/' + nestedBoardPathAcc.join('/') + '/';
        const board = boardById[boardId];

        return (
            <React.Fragment key={boardId}>
                <span className="mh4">{'/'}</span>
                <span className="BoardBreadcrumbs-item">
                    <Link to={boardUrl}>{board?.name ?? boardId}</Link>
                </span>
            </React.Fragment>
        );
    });

    return (
        <div className="BoardBreadcrumbs">
            <span className="BoardBreadcrumbs-item">
                <Link to={`/${environment.name}/list/`}>Lists</Link>
            </span>
            {nestedBoardPathDOM}
        </div>
    );
};
