import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import { Board } from 'components/Board/Board';

const BoardRoute: React.FunctionComponent<RouteComponentProps> = ({
    match,
}) => {
    const boardId = Number(match.params['boardId']);
    return <Board boardId={boardId} />;
};

export default BoardRoute;
