import React from 'react';

import { ComponentType } from 'const/analytics';
import { useBoardPath } from 'hooks/ui/useBoardPath';
import { useTrackView } from 'hooks/useTrackView';

import { Board } from './Board';

export const BoardWrapper: React.FunctionComponent = () => {
    useTrackView(ComponentType.LIST_PAGE);
    const boardPath = useBoardPath();
    const boardId = boardPath[boardPath.length - 1];

    return <Board boardId={boardId} />;
};
