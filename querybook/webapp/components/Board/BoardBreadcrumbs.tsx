import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useBoardPath } from 'hooks/ui/useBoardPath';
import { fetchBoardIfNeeded } from 'redux/board/action';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Link } from 'ui/Link/Link';
import { AccentText } from 'ui/StyledText/StyledText';

import './BoardBreadcrumbs.scss';

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
    const nestedBoardPathDOM =
        boardPath.length < 2
            ? null
            : boardPath.map((boardId, idx) => {
                  nestedBoardPathAcc.push(String(boardId));
                  const boardUrl = '/' + nestedBoardPathAcc.join('/') + '/';
                  const board = boardById[boardId];

                  return (
                      <React.Fragment key={boardId}>
                          {idx > 0 && (
                              <AccentText
                                  className="mh8 BoardBreadcrumbs-divder"
                                  weight="bold"
                                  color="lightest-0"
                              >
                                  /
                              </AccentText>
                          )}
                          <AccentText weight="bold" color="lightest-0">
                              <Link to={boardUrl}>
                                  {board?.name ?? boardId}
                              </Link>
                          </AccentText>
                      </React.Fragment>
                  );
              });

    return (
        <div className="BoardBreadcrumbs flex-row pl8">
            {nestedBoardPathDOM}
        </div>
    );
};
