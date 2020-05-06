import React from 'react';
import classNames from 'classnames';
import { titleize, sleep, copy } from 'lib/utils';

import { sendNotification } from 'lib/dataHubUI';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button } from 'ui/Button/Button';
import { DropdownMenu, IMenuItem } from 'ui/DropdownMenu/DropdownMenu';

const cellTypes = require('config/datadoc.yaml').cell_types;

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
        meta: {}
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

    const rightButtons: JSX.Element[] = [];
    const centerButtons: JSX.Element[] = [];

    const leftButtons: JSX.Element[] = [];
    const leftMenuItems: IMenuItem[] = [];

    if (isHeader) {
        if (shareUrl) {
            leftMenuItems.push({
                name: 'Share',
                onClick: () => {
                    copy(shareUrl);
                    sendNotification('Url Copied!');
                },
                tooltip: 'Click to copy',
                tooltipPos: 'right',
                icon: 'share',
            });
        }

        // Copy paste buttons
        if (copyCellAt) {
            leftMenuItems.push({
                name: 'Copy',
                onClick: () => copyCellAt(index, false),
                tooltip: 'Copy cell',
                tooltipPos: 'right',
                icon: 'copy',
            });
        }

        if (isEditable && copyCellAt) {
            leftMenuItems.push({
                name: 'Cut',
                onClick: () => copyCellAt(index, true),
                tooltip: 'Cut cell',
                tooltipPos: 'right',
                icon: 'cut',
            });
        }

        if (isEditable && pasteCellAt) {
            leftMenuItems.push({
                name: 'Paste',
                onClick: () => pasteCellAt(index),
                tooltip: 'Paste cell above',
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
                    borderless
                    onClick={deleteCellAt.bind(this, index)}
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
                        borderless
                        onClick={moveCellAt.bind(
                            this,
                            index,
                            isHeader ? index - 1 : index + 1
                        )}
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
                    <Button
                        className={
                            animateDefaultChange
                                ? 'block-crud-button disabled'
                                : 'block-crud-button'
                        }
                        borderless
                        onClick={
                            animateDefaultChange
                                ? null
                                : handleToggleDefaultCollapsed
                        }
                        icon={animateDefaultChange ? 'lock' : 'unlock'}
                        type="soft"
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

        Object.keys(cellTypes).forEach((cellKey) =>
            centerButtons.push(
                <AsyncButton
                    className="block-crud-button"
                    borderless
                    key={cellKey}
                    onClick={insertCellAt.bind(
                        null,
                        index,
                        cellKey,
                        null,
                        null
                    )}
                    icon="plus"
                    title={titleize(cellKey)}
                    type="soft"
                />
            )
        );
    }

    if (leftMenuItems.length) {
        leftButtons.unshift(
            <DropdownMenu
                className={'inline mr4'}
                key="dropdown-menu"
                customButtonRenderer={() => (
                    <Button
                        className="block-crud-button "
                        borderless
                        icon={'more-vertical'}
                        type="soft"
                    />
                )}
                items={leftMenuItems}
            />
        );
    }

    return (
        <div
            className={classNames({
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
            {rightButtons.length ? (
                <div className="block-right-buttons-wrapper flex-row">
                    {rightButtons}
                </div>
            ) : null}
        </div>
    );
};
