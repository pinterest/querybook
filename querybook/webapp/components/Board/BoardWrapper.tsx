import React from 'react';

import { useBoardPath } from 'hooks/ui/useBoardPath';

import { Board } from './Board';

export const BoardWrapper: React.FunctionComponent = () => {
    const boardPath = useBoardPath();
    const boardId = boardPath[boardPath.length - 1];

    return <Board boardId={boardId} />;
};
