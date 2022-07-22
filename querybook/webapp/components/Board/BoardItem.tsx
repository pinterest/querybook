import clsx from 'clsx';
import { ContentState } from 'draft-js';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';
import { BoardItemType } from 'const/board';
import { BoardPageContext } from 'context/BoardPage';
import { navigateWithinEnv } from 'lib/utils/query-string';
import {
    updateBoardItemDescription,
    updateBoardItemMeta,
} from 'redux/board/action';
import * as boardSelectors from 'redux/board/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Button } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';
import { Icon } from 'ui/Icon/Icon';
import { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';
import { AccentText, UntitledText } from 'ui/StyledText/StyledText';
import { Title } from 'ui/Title/Title';

import './BoardItem.scss';

export interface IBoardItemProps {
    /**
     * Id of the boardItem in DB
     */
    boardItemId: number;

    /**
     * Id of the item, i.e tableId or docId
     */
    itemId: number;
    itemType: BoardItemType;
    title: string;
    titleUrl: string;
    description?: ContentState;
}

const boardItemTypeToIcon: Record<BoardItemType, AllLucideIconNames> = {
    table: 'Database',
    data_doc: 'Book',
    board: 'Briefcase',
    query: 'PlayCircle',
};

export const BoardItem: React.FunctionComponent<IBoardItemProps> = ({
    boardItemId,
    itemId,
    itemType,
    title,
    titleUrl,
    description,
}) => {
    const {
        isCollapsed: defaultCollapsed,
        isEditMode,
        onDeleteBoardItem,
        boardId,
    } = React.useContext(BoardPageContext);
    const isEditable = useSelector((state: IStoreState) =>
        boardSelectors.canCurrentUserEditSelector(state, boardId)
    );

    const dispatch: Dispatch = useDispatch();
    const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

    const boardItemData = useSelector(
        (state: IStoreState) => state.board.boardItemById[boardItemId]
    );

    const displayItemDescription = React.useMemo(
        () =>
            itemType === 'table' &&
            boardItemData?.meta?.display_item_description,
        [boardItemData?.meta?.display_item_description, itemType]
    );

    React.useEffect(() => setCollapsed(defaultCollapsed), [defaultCollapsed]);

    const handleDescriptionSave = React.useCallback(
        (updatedDescription: ContentState) =>
            dispatch(
                updateBoardItemDescription(boardItemId, updatedDescription)
            ),
        [dispatch, boardItemId]
    );

    const handleDescriptionSwitch = React.useCallback(
        () =>
            dispatch(
                updateBoardItemMeta(boardItemId, {
                    ...boardItemData?.meta,
                    display_item_description: !displayItemDescription,
                })
            ),
        [dispatch, boardItemId, boardItemData, displayItemDescription]
    );

    const boardItemClassname = clsx(
        'BoardItem p12 mt8',
        collapsed ? 'mb8' : 'mb24'
    );

    const boardItemHeaderDOM = (
        <div className="flex-row">
            <Icon
                name={boardItemTypeToIcon[itemType]}
                size={20}
                className="mr8"
                color="light"
            />
            <div
                onClick={() =>
                    navigateWithinEnv(titleUrl, {
                        isModal: itemType === 'table' || itemType === 'query',
                    })
                }
            >
                {title ? (
                    <Title className="BoardItem-title" size="smedium">
                        {title}
                    </Title>
                ) : (
                    <UntitledText className="BoardItem-title" size="smedium" />
                )}
            </div>
        </div>
    );

    const boardItemControlsDOM = isEditMode ? (
        <>
            <IconButton
                size={18}
                icon="X"
                noPadding
                onClick={onDeleteBoardItem.bind(null, itemId, itemType)}
            />
            <IconButton size={18} icon="MoveVertical" noPadding />
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
    );

    const boardItemDescriptionDOM =
        collapsed || isEditMode || !boardItemData ? null : (
            <>
                {displayItemDescription ? (
                    description.getPlainText().length === 0 ? (
                        <AccentText
                            className="mt8"
                            noUserSelect
                            color="lightest"
                            size="small"
                        >
                            No {itemType} description
                        </AccentText>
                    ) : (
                        <RichTextEditor
                            className="mt8"
                            value={description}
                            readOnly={true}
                        />
                    )
                ) : (
                    <EditableTextField
                        className="mt8"
                        value={boardItemData?.description}
                        onSave={handleDescriptionSave}
                        readonly={!isEditable}
                    />
                )}
                {itemType === 'table' && isEditable && (
                    <div className="BoardItem-description-toggle">
                        <Button
                            className=" flex-row"
                            onClick={handleDescriptionSwitch}
                        >
                            <Icon name="Repeat" size={16} className="mr8" />
                            <AccentText size="xsmall">
                                {displayItemDescription
                                    ? 'Switch to Item Notes'
                                    : 'Switch to Table Description'}
                            </AccentText>
                        </Button>
                    </div>
                )}
            </>
        );

    return (
        <div className={boardItemClassname}>
            <div className="BoardItem-top horizontal-space-between">
                {boardItemHeaderDOM}
                <div className="BoardItem-controls flex-center">
                    {boardItemControlsDOM}
                </div>
            </div>
            {boardItemDescriptionDOM}
        </div>
    );
};
