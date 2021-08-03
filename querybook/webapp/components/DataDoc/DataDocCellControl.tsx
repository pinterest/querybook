import clsx from 'clsx';
import React, { useCallback } from 'react';
import toast from 'react-hot-toast';
import { titleize, sleep, copy } from 'lib/utils';

import { IDataCellMeta } from 'const/datadoc';
import { useBoundFunc } from 'hooks/useBoundFunction';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { SoftButton } from 'ui/Button/Button';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { ListMenu, IListMenuItem } from 'ui/Menu/ListMenu';
import { getShortcutSymbols, KeyMap } from 'lib/utils/keyboard';

const COPY_CELL_SHORTCUT = getShortcutSymbols(KeyMap.dataDoc.copyCell.key);
const PASTE_CELL_SHORTCUT = getShortcutSymbols(KeyMap.dataDoc.pasteCell.key);

const cellTypes: Record<
    string,
    {
        key: string;
        icon: string;
        name?: string;
        meta: Record<string, unknown>;
        meta_default: Record<string, unknown>;
    }
> = require('config/datadoc.yaml').cell_types;

interface IProps {
    index?: number;
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
    const [animateDefaultChange, setAnimateDefaultChange] = React.useState(
        false
    );

    const handleToggleDefaultCollapsed = React.useCallback(() => {
        setAnimateDefaultChange(true);
        Promise.all([sleep(500), toggleDefaultCollapsed()]).then(() =>
            setAnimateDefaultChange(false)
        );
    }, [toggleDefaultCollapsed]);

    const handleShare = useCallback(() => {
        copy(shareUrl);
        toast('Url Copied!');
    }, [shareUrl]);
    const handleCopyCell = useBoundFunc(copyCellAt, index, false);
    const handleCutCell = useBoundFunc(copyCellAt, index, true);
    const handlePasteCell = useBoundFunc(pasteCellAt, index);
    const handleDeleteCell = useBoundFunc(deleteCellAt, index);
    const handleMoveCellClick = useCallback(
        () => moveCellAt(index, isHeader ? index - 1 : index + 1),
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
                icon: 'share',
            });
        }

        // Copy paste buttons
        if (copyCellAt) {
            leftMenuItems.push({
                name: `Copy (${COPY_CELL_SHORTCUT})`,
                onClick: handleCopyCell,
                tooltip: 'Copy cell',
                tooltipPos: 'right',
                icon: 'copy',
            });
        }

        if (isEditable && copyCellAt) {
            leftMenuItems.push({
                name: 'Cut',
                onClick: handleCutCell,
                tooltip: 'Cut cell',
                tooltipPos: 'right',
                icon: 'cut',
            });
        }

        if (isEditable && pasteCellAt) {
            leftMenuItems.push({
                name: `Paste (${PASTE_CELL_SHORTCUT})`,
                onClick: handlePasteCell,
                tooltip: 'Paste cell to above',
                tooltipPos: 'right',
                icon: 'paste',
            });
        }
    }

    if (isEditable) {
        // Delete Button
        rightButtons.push(
            deleteCellAt && isHeader && numberOfCells > 0 && (
                <AsyncButton
                    className="block-crud-button"
                    onClick={handleDeleteCell}
                    icon="x"
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
                        icon={isHeader ? 'chevrons-up' : 'chevrons-down'}
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
                        icon={animateDefaultChange ? 'lock' : 'unlock'}
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
                          icon: showCollapsed ? 'expand' : 'compress',
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
                className={'inline mr4'}
                key="dropdown-menu"
                customButtonRenderer={() => (
                    <SoftButton
                        className="block-crud-button "
                        icon={'more-vertical'}
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
                active,
            })}
        >
            {leftButtons.length ? (
                <div className="block-left-buttons-wrapper flex-row">
                    {leftButtons}
                </div>
            ) : null}
            {centerButtons}
            <span>&nbsp;</span>
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
        (cellType: string) => insertCellAt(index, cellType, null, null),
        [insertCellAt, index]
    );

    const buttonsDOM = Object.entries(cellTypes).map(([cellKey, cellType]) => (
        <AsyncButton
            className="block-crud-button"
            key={cellKey}
            onClick={() => handleInsertcell(cellKey)}
            icon="plus"
            title={cellType.name ?? titleize(cellKey)}
            type="soft"
        />
    ));
    return <>{buttonsDOM}</>;
});
