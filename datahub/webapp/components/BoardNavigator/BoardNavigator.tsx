import React, { useEffect } from 'react';
import Resizable from 're-resizable';

import { enableResizable } from 'lib/utils';
import { BoardList } from 'components/BoardList/BoardList';
import { BoardMiniView } from 'components/BoardMiniView/BoardMiniView';
import { FullHeight } from 'ui/FullHeight/FullHeight';
import './BoardNavigator.scss';

export const BoardNavigator: React.FunctionComponent = ({}) => {
    const [boardId, setBoardId] = React.useState<number>(null);

    const boardListDOM = (
        <BoardList
            onBoardClick={(board) => {
                setBoardId(board.id);
            }}
            selectedBoardIds={[boardId]}
        />
    );

    const boardView = boardId && (
        <Resizable
            className="board-info-panel"
            defaultSize={{
                width: '100%',
                // Bug https://github.com/bokuweb/re-resizable/issues/442
                // TODO: switch to percentage once its resolved
                height: '600px',
            }}
            enable={enableResizable({ top: true, bottom: true })}
        >
            <BoardMiniView id={boardId} onHide={() => setBoardId(null)} />
        </Resizable>
    );

    return (
        <FullHeight className="BoardNavigator" flex="column">
            {boardListDOM}
            {boardView}
        </FullHeight>
    );
};
