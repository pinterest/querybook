import { ContentState } from 'draft-js';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';
import { BoardViewersBadge } from 'components/BoardViewersBadge/BoardViewersBadge';
import { IBoardWithItemIds } from 'const/board';
import { generateFormattedDate } from 'lib/utils/datetime';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { updateBoard } from 'redux/board/action';
import { updateSearchFilter, updateSearchType } from 'redux/search/action';
import { SearchType } from 'redux/search/types';
import { Dispatch } from 'redux/store/types';
import { TextButton } from 'ui/Button/Button';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';
import { AccentText } from 'ui/StyledText/StyledText';

import './BoardHeader.scss';

interface IProps {
    board: IBoardWithItemIds;
    isEditable: boolean;
}

export const BoardHeader: React.FunctionComponent<IProps> = ({
    board,
    isEditable,
}) => {
    const dispatch: Dispatch = useDispatch();

    const openSearchModal = React.useCallback(
        (searchType: SearchType) => {
            dispatch(updateSearchType(searchType));
            if (searchType === SearchType.Query) {
                dispatch(updateSearchFilter('query_type', 'query_execution'));
            }
            navigateWithinEnv('/search/', { isModal: true, boardId: board.id });
        },
        [dispatch, board.id]
    );

    const handleDescriptionUpdate = React.useCallback(
        (description: ContentState) =>
            dispatch(
                updateBoard(board.id, board.name, board.public, description)
            ),
        [dispatch, board.id, board.name, board.public]
    );

    const handleTitleChange = React.useCallback(
        (updatedTitle: string) => {
            dispatch(updateBoard(board.id, updatedTitle));
        },
        [dispatch, board.id]
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
                        isEditable={isEditable}
                    />
                </div>
            </div>
            <AccentText
                className="pv8"
                color="light"
                size="xlarge"
                weight="extra"
            >
                {isEditable ? (
                    <DebouncedInput
                        value={board.name}
                        onChange={handleTitleChange}
                        className="BoardHeader-title"
                        transparent
                    />
                ) : (
                    <div className="ml8">{board.name}</div>
                )}
            </AccentText>
            <EditableTextField
                value={board.description}
                onSave={handleDescriptionUpdate}
                readonly={!isEditable}
            />
            {isEditable && (
                <div className="BoardHeader-add-buttons flex-row mt8">
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
                        className="BoardHeader-add-table"
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
            )}
        </div>
    );
};
