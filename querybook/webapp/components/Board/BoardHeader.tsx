import * as React from 'react';
import { ContentState } from 'draft-js';

import { IBoardWithItemIds } from 'const/board';
import { generateFormattedDate } from 'lib/utils/datetime';

import { AccentText } from 'ui/StyledText/StyledText';
import { BoardViewersBadge } from 'components/BoardViewersBadge/BoardViewersBadge';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';

import './BoardHeader.scss';
import { TextButton } from 'ui/Button/Button';
import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';

interface IProps {
    board: IBoardWithItemIds;
}

// TODO - meowcodes: make add item work + add add to list button
export const BoardHeader: React.FunctionComponent<IProps> = ({ board }) => (
    <div className="BoardHeader">
        <div className="horizontal-space-between mb4">
            <div className="flex-row mr8">
                <AccentText
                    className="ml8 mr16"
                    size="text"
                    weight="bold"
                    color="lightest"
                >
                    {`Updated ${generateFormattedDate(board.updated_at, 'X')}`}
                </AccentText>
                <BoardItemAddButton
                    size={18}
                    itemType="board"
                    itemId={board.id}
                    noPadding
                    tooltipPos="right"
                    tooltip="Add to another list"
                />
            </div>
            <div className="BoardHeader-users flex-row">
                <BoardViewersBadge boardId={board.id} isPublic={board.public} />
            </div>
        </div>
        <AccentText className="p8" color="light" size="xlarge" weight="extra">
            {board.name}
        </AccentText>
        <EditableTextField
            value={board.description as ContentState}
            onSave={() => null}
        />
        <div className="flex-row mt8">
            <TextButton icon="Plus" title="Data Doc" onClick={() => null} />
            <TextButton icon="Plus" title="Table" onClick={() => null} />
            <TextButton icon="Plus" title="Board" onClick={() => null} />
        </div>
    </div>
);
