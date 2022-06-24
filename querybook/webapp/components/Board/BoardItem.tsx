import * as React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { BoardItemType } from 'const/board';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { titleize } from 'lib/utils';
import { convertRawToContentState } from 'lib/richtext/serialize';
import { Dispatch, IStoreState } from 'redux/store/types';
import { updateBoardItemDescription } from 'redux/board/action';

import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';

import { IconButton } from 'ui/Button/IconButton';
import { Icon } from 'ui/Icon/Icon';
import { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { Title } from 'ui/Title/Title';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';

import './BoardItem.scss';

export interface IBoardItemProps {
    boardId: number;
    boardItemId: number;
    itemId: number;
    itemType: BoardItemType;
    title: string;
    titleUrl: string;
    defaultCollapsed: boolean;
    isEditMode: boolean;
}

const boardItemTypeToIcon: Record<BoardItemType, AllLucideIconNames> = {
    table: 'Book',
    data_doc: 'File',
    board: 'Briefcase',
};

export const BoardItem: React.FunctionComponent<IBoardItemProps> = ({
    boardId,
    boardItemId,
    itemId,
    itemType,
    title,
    titleUrl,
    defaultCollapsed,
    isEditMode,
}) => {
    const dispatch: Dispatch = useDispatch();
    const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

    const boardItemData = useSelector(
        (state: IStoreState) => state.board.boardItemById[boardItemId]
    );

    React.useEffect(() => setCollapsed(defaultCollapsed), [defaultCollapsed]);

    const handleDescriptionSave = React.useCallback(
        (updatedDescription) =>
            dispatch(
                updateBoardItemDescription(
                    boardId,
                    boardItemId,
                    updatedDescription
                )
            ),
        [boardId, boardItemId]
    );

    return (
        <div className="BoardItem mt8 mb16 p12">
            <div className="BoardItem-top horizontal-space-between">
                <div className="flex-row">
                    <Icon
                        name={boardItemTypeToIcon[itemType]}
                        size={20}
                        className="mr8"
                        color="light"
                    />
                    <Link to={getWithinEnvUrl(titleUrl)}>
                        <Title
                            size="smedium"
                            tooltip={`Go to ${titleize(itemType, '_', ' ')}`}
                            tooltipPos="right"
                        >
                            {title}
                        </Title>
                    </Link>
                </div>
                <div className="BoardItem-controls flex-center">
                    {isEditMode ? (
                        <>
                            <IconButton size={18} icon="X" noPadding />
                            <IconButton
                                size={18}
                                icon="MoveVertical"
                                noPadding
                            />
                        </>
                    ) : (
                        <>
                            <BoardItemAddButton
                                size={18}
                                itemType={itemType}
                                itemId={itemId}
                                noPadding
                                popoverLayout={['left', 'top']}
                                tooltipPos="left"
                                tooltip="Add to another list"
                            />
                            <IconButton
                                size={18}
                                icon={collapsed ? 'Maximize2' : 'Minimize2'}
                                onClick={() => setCollapsed((c) => !c)}
                                noPadding
                            />
                        </>
                    )}
                </div>
            </div>
            {collapsed ||
            isEditMode ||
            !boardItemData ||
            boardId === 0 ? null : (
                <EditableTextField
                    className="mt8"
                    value={boardItemData.description}
                    onSave={handleDescriptionSave}
                />
            )}
        </div>
    );
};
