import * as React from 'react';

import { IBoardWithItemIds } from 'const/board';
import { generateFormattedDate } from 'lib/utils/datetime';

import { AccentText, StyledText } from 'ui/StyledText/StyledText';
import { BoardViewersBadge } from 'components/BoardViewersBadge/BoardViewersBadge';

interface IProps {
    board: IBoardWithItemIds;
}

export const BoardHeader: React.FunctionComponent<IProps> = ({ board }) => {
    console.log('board', board);
    return (
        <div className="BoardHeader">
            <div className="horizontal-space-between mb4">
                <div className="flex-row mr8">
                    <AccentText
                        className="ml8"
                        size="text"
                        weight="bold"
                        color="lightest"
                    >
                        {`Created ${generateFormattedDate(
                            board.created_at,
                            'X'
                        )}`}
                    </AccentText>
                </div>
                <div className="BoardHeader-users flex-row">
                    <BoardViewersBadge
                        boardId={board.id}
                        isPublic={board.public}
                    />
                </div>
            </div>
            <AccentText
                className="p8"
                color="light"
                size="xlarge"
                weight="extra"
            >
                {board.name}
            </AccentText>
            <StyledText className="mh8">{board.description}</StyledText>
        </div>
    );
};
