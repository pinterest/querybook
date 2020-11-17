import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import { Board } from './Board';

export const BoardWrapper: React.FunctionComponent<RouteComponentProps> = ({
    match,
}) => {
    const boardId = Number(match.params['boardId']);
    return <Board boardId={boardId} />;
};
