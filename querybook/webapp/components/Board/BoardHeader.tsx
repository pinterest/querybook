import * as React from 'react';
import { useDispatch } from 'react-redux';

import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';
import { BoardViewersBadge } from 'components/BoardViewersBadge/BoardViewersBadge';
import { IBoardWithItemIds } from 'const/board';
import { generateFormattedDate } from 'lib/utils/datetime';
import { navigateWithinEnv } from 'lib/utils/query-string';
import {
    setCurrentBoardId,
    updateBoardDescription,
    updateBoardName,
} from 'redux/board/action';
import { updateSearchFilter, updateSearchType } from 'redux/search/action';
import { SearchType } from 'redux/search/types';
import { Dispatch } from 'redux/store/types';
import { TextButton } from 'ui/Button/Button';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';
import { AccentText } from 'ui/StyledText/StyledText';

import './BoardHeader.scss';

interface IProps {
    board: IBoardWithItemIds;
}

// TODO - meowcodes: make add item work + add add to list button
export const BoardHeader: React.FunctionComponent<IProps> = ({ board }) => {
    const dispatch: Dispatch = useDispatch();

    const openSearchModal = React.useCallback(
        (searchType: SearchType) => {
            dispatch(updateSearchType(searchType));
            if (searchType === SearchType.Query) {
                dispatch(updateSearchFilter('query_type', 'query_execution'));
            }
            dispatch(setCurrentBoardId(board.id));
            navigateWithinEnv('/search/', { isModal: true, from: 'board' });
        },
        [board.id]
    );

    const handleDescriptionUpdate = React.useCallback(
        (description) =>
            dispatch(updateBoardDescription(board.id, description)),
        [board.id]
    );

    const handleTitleChange = React.useCallback(
        (updatedTitle) => {
            dispatch(updateBoardName(board.id, updatedTitle));
        },
        [board.id]
    );

    return (
        <div className="BoardHeader">
            <div className="horizontal-space-between mb4">
                <div className="flex-row mr8">
                    <AccentText
                        className="ml8 mr16"
                        size="text"
                        weight="bold"
                        color="lightest"
                    >
                        {`Updated ${generateFormattedDate(
                            board.updated_at,
                            'X'
                        )}`}
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
                <ResizableTextArea
                    value={board.name}
                    onChange={handleTitleChange}
                    className="BoardHeader-title"
                    transparent
                />
            </AccentText>
            <EditableTextField
                value={board.description}
                onSave={handleDescriptionUpdate}
            />
            <div className="flex-row mt8">
                <TextButton
                    icon="Plus"
                    title="Query Execution"
                    onClick={() => openSearchModal(SearchType.Query)}
                />
                <TextButton
                    icon="Plus"
                    title="Data Doc"
                    onClick={() => openSearchModal(SearchType.DataDoc)}
                />
                <TextButton
                    icon="Plus"
                    title="Table"
                    onClick={() => openSearchModal(SearchType.Table)}
                />
                <TextButton
                    icon="Plus"
                    title="List"
                    onClick={() => openSearchModal(SearchType.Board)}
                />
            </div>
        </div>
    );
};
