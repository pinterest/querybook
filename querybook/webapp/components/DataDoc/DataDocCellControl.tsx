import clsx from 'clsx';
import React, { useCallback } from 'react';
import toast from 'react-hot-toast';

import DatadocConfig from 'config/datadoc.yaml';
import { ComponentType, ElementType } from 'const/analytics';
import { CommentEntityType } from 'const/comment';
import { IDataCellMeta } from 'const/datadoc';
import { useBoundFunc } from 'hooks/useBoundFunction';
import { trackClick } from 'lib/analytics';
import { copy, sleep, titleize } from 'lib/utils';
import { getShortcutSymbols, KeyMap } from 'lib/utils/keyboard';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { SoftButton } from 'ui/Button/Button';
import { CommentButton } from 'ui/Comment/CommentButton';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { IListMenuItem, ListMenu } from 'ui/Menu/ListMenu';

const COPY_CELL_SHORTCUT = getShortcutSymbols(KeyMap.dataDoc.copyCell.key);
const PASTE_CELL_SHORTCUT = getShortcutSymbols(KeyMap.dataDoc.pasteCell.key);

const cellTypes = DatadocConfig.cell_types;

interface IProps {
    index?: number;
    cellId?: number;
    isHeader: boolean;

    numberOfCells: number;
    moveCellAt?: (index1: number, index2: number) => any;

    pasteCellAt?: (index: number) => any;
    copyCellAt?: (index: number, cut?: boolean) => any;

    insertCellAt: (
        index: number,
        cellKey: string,
        context: string,
        meta: IDataCellMeta
    ) => any;
    deleteCellAt?: (index: number) => any;

    active?: boolean;
    isEditable: boolean;
    showCollapsed?: boolean;
    setShowCollapsed?: (collapsed: boolean) => any;
    isCollapsedDefault?: boolean;
    toggleDefaultCollapsed?: () => Promise<any>;
    shareUrl?: string;
}

export const DataDocCellControl: React.FunctionComponent<IProps> = ({
    index,
    cellId,
    isHeader,

    numberOfCells,
    moveCellAt,
    insertCellAt,
    deleteCellAt,

    copyCellAt,
    pasteCellAt,

    active,
    isEditable,
    showCollapsed,
    setShowCollapsed,
    isCollapsedDefault,
    toggleDefaultCollapsed,
    shareUrl,
}) => {
    const [animateDefaultChange, setAnimateDefaultChange] =
        React.useState(false);

    const handleToggleDefaultCollapsed = React.useCallback(() => {
        trackClick({
            component: ComponentType.DATADOC_PAGE,
            element: ElementType.COLLAPSE_CELL_BUTTON,
        });
        setAnimateDefaultChange(true);
        Promise.all([sleep(500), toggleDefaultCollapsed()]).then(() =>
            setAnimateDefaultChange(false)
        );
    }, [toggleDefaultCollapsed]);

    const handleShare = useCallback(() => {
        trackClick({
            component: ComponentType.DATADOC_PAGE,
            element: ElementType.SHARE_CELL_BUTTON,
        });
        copy(shareUrl);
        toast('Url Copied!');
    }, [shareUrl]);
    const handleCopyCell = useBoundFunc(copyCellAt, index, false);
    const handleCutCell = useBoundFunc(copyCellAt, index, true);
    const handlePasteCell = useBoundFunc(pasteCellAt, index);
    const handleDeleteCell = useBoundFunc(deleteCellAt, index);
    const handleMoveCellClick = useCallback(
        () =>
            moveCellAt(
                isHeader ? index : index - 1,
                isHeader ? index - 1 : index
            ),
        [moveCellAt, index, isHeader]
    );

    const rightButtons: JSX.Element[] = [];
    const centerButtons: JSX.Element[] = [];

    const leftButtons: JSX.Element[] = [];
    const leftMenuItems: IListMenuItem[] = [];

    if (isHeader) {
        if (shareUrl) {
            leftMenuItems.push({
                name: 'Share',
                onClick: handleShare,
                tooltip: 'Click to copy',
                tooltipPos: 'right',
                icon: 'Share',
            });
        }

        // Copy paste buttons
        if (copyCellAt) {
            leftMenuItems.push({
                name: `Copy (${COPY_CELL_SHORTCUT})`,
                onClick: handleCopyCell,
                tooltip: 'Copy cell',
                tooltipPos: 'right',
                icon: 'Copy',
            });
        }

        if (isEditable && copyCellAt) {
            leftMenuItems.push({
                name: 'Cut',
                onClick: handleCutCell,
                tooltip: 'Cut cell',
                tooltipPos: 'right',
                icon: 'Scissors',
            });
        }

        if (isEditable && pasteCellAt) {
            leftMenuItems.push({
                name: `Paste (${PASTE_CELL_SHORTCUT})`,
                onClick: handlePasteCell,
                tooltip: 'Paste cell to above',
                tooltipPos: 'right',
                icon: 'Clipboard',
            });
        }

        if (cellId) {
            rightButtons.push(
                <CommentButton
                    key="comment"
                    entityType={CommentEntityType.CELL}
                    entityId={cellId}
                />
            );
        }
    }

    if (isEditable) {
        // Delete Button
        rightButtons.push(
            deleteCellAt && isHeader && numberOfCells > 0 && (
                <AsyncButton
                    className="block-crud-button"
                    onClick={handleDeleteCell}
                    icon="X"
                    type="soft"
                    key="delete"
                />
            )
        );

        // Swap Button
        rightButtons.push(
            ((isHeader && index > 0) ||
                (!isHeader && index <= numberOfCells - 1)) &&
                moveCellAt && (
                    <AsyncButton
                        className="block-crud-button"
                        onClick={handleMoveCellClick}
                        icon={isHeader ? 'ChevronsUp' : 'ChevronsDown'}
                        type="soft"
                        key="swap"
                    />
                )
        );

        if (isHeader && showCollapsed !== undefined) {
            // undefined means the cell cannot be collapsed
            leftButtons.push(
                !isCollapsedDefault && toggleDefaultCollapsed && (
                    <SoftButton
                        className={
                            animateDefaultChange
                                ? 'block-crud-button disabled'
                                : 'block-crud-button'
                        }
                        onClick={
                            animateDefaultChange
                                ? null
                                : handleToggleDefaultCollapsed
                        }
                        icon={animateDefaultChange ? 'Lock' : 'Unlock'}
                        aria-label={
                            showCollapsed
                                ? 'default to collapsed'
                                : 'default to uncollapsed'
                        }
                        data-balloon-pos="down"
                        key="default-collapse"
                    />
                )
            );

            leftMenuItems.push(
                setShowCollapsed
                    ? {
                          onClick: () => setShowCollapsed(!showCollapsed),
                          name: showCollapsed ? 'Uncollapse' : 'Collapse',
                          icon: showCollapsed ? 'Maximize2' : 'Minimize2',
                      }
                    : null
            );
        }

        centerButtons.push(
            <InsertCellButtons
                index={index}
                key="insert-cell-buttons"
                insertCellAt={insertCellAt}
            />
        );
    } else {
        // In case center buttons are empty
        // push an empty span to ensure the width
        centerButtons.push(<span key="empty" />);
    }

    if (leftMenuItems.length) {
        leftButtons.unshift(
            <Dropdown
                className={'inline mr8'}
                key="dropdown-menu"
                customButtonRenderer={() => (
                    <SoftButton
                        className="block-crud-button "
                        icon="MoreVertical"
                    />
                )}
            >
                <ListMenu items={leftMenuItems} soft />
            </Dropdown>
        );
    }

    return (
        <div
            className={clsx({
                'block-crud-buttons': true,
                'flex-center': true,
                // Exclude the first header to prevent layout shift when it is hidden
                'is-header': isHeader && index !== 0,
                active,
            })}
        >
            {leftButtons.length ? (
                <div className="block-left-buttons-wrapper flex-row">
                    {leftButtons}
                </div>
            ) : null}
            {centerButtons}
            {rightButtons.length ? (
                <div className="block-right-buttons-wrapper flex-row">
                    {rightButtons}
                </div>
            ) : null}
        </div>
    );
};

const InsertCellButtons: React.FC<{
    insertCellAt: IProps['insertCellAt'];
    index: number;
}> = React.memo(({ insertCellAt, index }) => {
    const handleInsertcell = useCallback(
        (cellType: string) => {
            trackClick({
                component: ComponentType.DATADOC_PAGE,
                element: ElementType.INSERT_CELL_BUTTON,
                aux: {
                    type: cellType,
                },
            });
            return insertCellAt(index, cellType, null, null);
        },
        [insertCellAt, index]
    );

    const buttonsDOM = Object.entries(cellTypes).map(([cellKey, cellType]) => (
        <AsyncButton
            className="block-crud-button"
            key={cellKey}
            onClick={() => handleInsertcell(cellKey)}
            icon="Plus"
            title={cellType.name ?? titleize(cellKey)}
            type="soft"
        />
    ));
    return <>{buttonsDOM}</>;
});
