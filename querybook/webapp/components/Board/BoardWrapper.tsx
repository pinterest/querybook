import React from 'react';

import { useBoardPath } from 'hooks/ui/useBoardPath';

import { Board } from './Board';
import { BoardBreadcrumbs } from './BoardBreadcrumbs';

export const BoardWrapper: React.FunctionComponent = () => {
    const boardPath = useBoardPath();
    const boardId = boardPath[boardPath.length - 1];

    return (
        <>
            <BoardBreadcrumbs />
            <Board boardId={boardId} />
        </>
    );
};
