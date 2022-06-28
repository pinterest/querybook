import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import clsx from 'clsx';
import { ContentState } from 'draft-js';

import { BoardItemType } from 'const/board';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { Dispatch, IStoreState } from 'redux/store/types';
import {
    updateBoardItemDescription,
    updateBoardItemMeta,
} from 'redux/board/action';
import { convertContentStateToHTML } from 'lib/richtext/serialize';

import { BoardItemAddButton } from 'components/BoardItemAddButton/BoardItemAddButton';

import { IconButton } from 'ui/Button/IconButton';
import { Icon } from 'ui/Icon/Icon';
import { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { Title } from 'ui/Title/Title';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';
import { Button } from 'ui/Button/Button';
import { RichTextEditor } from 'ui/RichTextEditor/RichTextEditor';
import { AccentText } from 'ui/StyledText/StyledText';

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
    tableDescription?: ContentState;
}

const boardItemTypeToIcon: Record<BoardItemType, AllLucideIconNames> = {
    table: 'Book',
    data_doc: 'File',
    board: 'Briefcase',
    query: 'PlayCircle',
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
    tableDescription,
}) => {
    const dispatch: Dispatch = useDispatch();
    const [collapsed, setCollapsed] = React.useState(defaultCollapsed);

    const { boardItemData } = useSelector((state: IStoreState) => ({
        boardItemData: state.board.boardItemById[boardItemId],
    }));

    const displayTableDescription = React.useMemo(
        () =>
            itemType === 'table' &&
            boardItemData?.meta?.display_table_description,
        [boardItemData?.meta?.display_table_description, itemType]
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

    const handleDescriptionSwitch = React.useCallback(() => {
        dispatch(
            updateBoardItemMeta(boardId, boardItemId, {
                ...boardItemData?.meta,
                display_table_description: !displayTableDescription,
            })
        );
    }, [boardId, boardItemData, displayTableDescription]);

    const boardItemClassname = clsx({
        BoardItem: true,
        p12: true,
        mt8: true,
        mb8: collapsed,
        mb24: !collapsed,
    });

    return (
        <div className={boardItemClassname}>
            <div className="BoardItem-top horizontal-space-between">
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
                                isModal:
                                    itemType === 'table' ||
                                    itemType === 'query',
                            })
                        }
                    >
                        <Title className="BoardItem-title" size="smedium">
                            {title}
                        </Title>
                    </div>
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
                <>
                    {displayTableDescription ? (
                        convertContentStateToHTML(tableDescription).length ===
                            0 ||
                        convertContentStateToHTML(tableDescription) ===
                            '<p><br></p>' ? (
                            <AccentText
                                className="mt8"
                                noUserSelect
                                color="lightest"
                                size="small"
                            >
                                No table description
                            </AccentText>
                        ) : (
                            <RichTextEditor
                                className="mt8"
                                value={tableDescription}
                                readOnly={true}
                            />
                        )
                    ) : (
                        <EditableTextField
                            className="mt8"
                            value={boardItemData?.description}
                            onSave={handleDescriptionSave}
                        />
                    )}
                    {itemType === 'table' && (
                        <div className="BoardItem-description-toggle">
                            <Button
                                className=" flex-row"
                                onClick={handleDescriptionSwitch}
                            >
                                <Icon name="Repeat" size={16} className="mr8" />
                                <AccentText size="xsmall">
                                    {displayTableDescription
                                        ? 'Switch to Item Notes'
                                        : 'Switch to Table Description'}
                                </AccentText>
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
