import clsx from 'clsx';
import { ContentState } from 'draft-js';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';
import { UserBadge } from 'components/UserBadge/UserBadge';
import { BoardItemType } from 'const/board';
import { BoardPageContext } from 'context/BoardPage';
import { generateFormattedDate } from 'lib/utils/datetime';
import { getWithinEnvUrl } from 'lib/utils/query-string';
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
import { Link } from 'ui/Link/Link';
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

    authorUid?: number;
    updatedAt?: number;
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
    authorUid,
    updatedAt,
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

    const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

    React.useEffect(() => setCollapsed(defaultCollapsed), [defaultCollapsed]);

    const boardItemClassname = clsx(
        'BoardItem p12 mt8',
        collapsed ? 'mb8' : isEditable && itemType === 'table' ? 'mb24' : 'mb16'
    );

    const boardItemHeaderDOM = (
        <div className="flex-row">
            <Icon
                name={boardItemTypeToIcon[itemType]}
                size={20}
                className="mr8"
                color="light"
            />
            <Link
                to={{
                    pathname: getWithinEnvUrl(titleUrl),
                    state: {
                        isModal: itemType === 'table' || itemType === 'query',
                    },
                }}
            >
                {title ? (
                    <Title className="BoardItem-title" size="smedium">
                        {title}
                    </Title>
                ) : (
                    <UntitledText className="BoardItem-title" size="smedium" />
                )}
            </Link>
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

    return (
        <div className={boardItemClassname}>
            <div className="BoardItem-top horizontal-space-between">
                {boardItemHeaderDOM}

                <div className="BoardItem-controls flex-center">
                    {boardItemControlsDOM}
                </div>
            </div>
            <BoardItemDescription
                boardItemId={boardItemId}
                description={description}
                itemType={itemType}
                collapsed={collapsed || isEditMode}
                isEditable={isEditable}
            />
            <BoardItemFooter
                authorUid={authorUid}
                updatedAt={updatedAt}
                collapsed={collapsed || isEditMode}
            />
        </div>
    );
};

const BoardItemDescription: React.FC<{
    boardItemId: number;
    description: ContentState;
    itemType: BoardItemType;
    collapsed: boolean;
    isEditable: boolean;
}> = ({
    boardItemId,
    description,
    itemType,

    collapsed,
    isEditable,
}) => {
    const boardItemData = useSelector(
        (state: IStoreState) => state.board.boardItemById[boardItemId]
    );
    const dispatch: Dispatch = useDispatch();

    const displayItemDescription = React.useMemo(
        () =>
            itemType === 'table' &&
            boardItemData?.meta?.display_item_description,
        [boardItemData?.meta?.display_item_description, itemType]
    );

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

    if (collapsed || !boardItemData) {
        return null;
    }

    const itemDescriptionToggle = itemType === 'table' && isEditable && (
        <div className="BoardItem-description-toggle">
            <Button className=" flex-row" onClick={handleDescriptionSwitch}>
                <Icon name="Repeat" size={16} className="mr8" />
                <AccentText size="xsmall">
                    {displayItemDescription
                        ? 'Switch to Item Notes'
                        : 'Switch to Table Description'}
                </AccentText>
            </Button>
        </div>
    );

    return (
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
            {itemDescriptionToggle}
        </>
    );
};

const BoardItemFooter: React.FC<{
    authorUid?: number;
    updatedAt?: number;
    collapsed: boolean;
}> = ({ authorUid, updatedAt, collapsed }) => {
    if (collapsed || (authorUid == null && updatedAt == null)) {
        return null;
    }

    return (
        <div className="horizontal-space-between">
            <div className="flex-row">
                {authorUid != null && (
                    <UserBadge uid={authorUid} mini cardStyle />
                )}
            </div>
            <div className="mr4">
                {updatedAt != null && (
                    <AccentText weight="bold" color="lightest">
                        updated {generateFormattedDate(updatedAt)}
                    </AccentText>
                )}
            </div>
        </div>
    );
};
