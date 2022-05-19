import * as React from 'react';

import './BoardViewersList.scss';

interface IProps {
    boardId: number;
}

export const BoardViewersList: React.FunctionComponent<IProps> = ({
    boardId,
}) => {
    console.log('board');
    return <div className="BoardViewersList">meow</div>;
};
