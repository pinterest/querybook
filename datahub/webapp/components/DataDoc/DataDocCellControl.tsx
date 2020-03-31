import React from 'react';
import classNames from 'classnames';
import { titleize, sleep } from 'lib/utils';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button } from 'ui/Button/Button';

const cellTypes = require('config/datadoc.yaml').cell_types;

interface IProps {
    index?: number;
    isHeader: boolean;

    numberOfCells: number;
    moveCellAt?: (index1: number, index2: number) => any;
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
}

export const DataDocCellControl: React.FunctionComponent<IProps> = ({
    index,
    isHeader,

    numberOfCells,
    moveCellAt,
    insertCellAt,
    deleteCellAt,

    active,
    isEditable,
    showCollapsed,
    setShowCollapsed,
    isCollapsedDefault,
    toggleDefaultCollapsed,
}) => {
    if (!isEditable) {
        return null;
    }

    const [animateDefaultChange, setAnimateDefaultChange] = React.useState(
        false
    );

    const swapCellButtonDOM = ((isHeader && index > 0) ||
        (!isHeader && index <= numberOfCells - 1)) && (
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
        />
    );

    const deleteCellButtonDOM = deleteCellAt &&
        isHeader &&
        numberOfCells > 0 && (
            <AsyncButton
                className="block-crud-button"
                borderless
                onClick={deleteCellAt.bind(this, index)}
                icon="x"
                type="soft"
            />
        );

    const handleToggleDefaultCollapsed = React.useCallback(() => {
        setAnimateDefaultChange(true);
        Promise.all([sleep(500), toggleDefaultCollapsed()]).then(() =>
            setAnimateDefaultChange(false)
        );
    }, [toggleDefaultCollapsed]);

    let collapseCellButtonDOM: React.ReactChild;
    if (isHeader && showCollapsed !== undefined) {
        // undefined means the cell cannot be collapsed
        const setDefaultCollapsedButton = !isCollapsedDefault && (
            <Button
                className={
                    animateDefaultChange
                        ? 'block-crud-button disabled'
                        : 'block-crud-button'
                }
                borderless
                onClick={
                    animateDefaultChange ? null : handleToggleDefaultCollapsed
                }
                icon={animateDefaultChange ? 'lock' : 'unlock'}
                type="soft"
                attachedLeft
                aria-label={
                    showCollapsed
                        ? 'default to collapsed'
                        : 'default to uncollapsed'
                }
                data-balloon-pos="down"
            />
        );
        const collapseButtonDOM = (
            <AsyncButton
                className="block-crud-button"
                borderless
                onClick={() => setShowCollapsed(!showCollapsed)}
                icon={showCollapsed ? 'maximize-2' : 'minimize-2'}
                type="soft"
                attachedRight={isCollapsedDefault}
                aria-label={showCollapsed ? 'Uncollapse' : 'Collapse'}
                data-balloon-pos="down"
            />
        );
        collapseCellButtonDOM = (
            <div className="block-collapse-buttons-wrapper">
                {collapseButtonDOM}
                {setDefaultCollapsedButton}
            </div>
        );
    }
    const cellEditButtonsDOM = (
        <div className="block-edit-buttons-wrapper flex-row">
            {deleteCellButtonDOM}
            {swapCellButtonDOM}
        </div>
    );

    const insertCellButtons = Object.keys(cellTypes).map((cellKey) => (
        <AsyncButton
            className="block-crud-button"
            borderless
            key={cellKey}
            onClick={insertCellAt.bind(null, index, cellKey, null, null)}
            icon="plus"
            title={titleize(cellKey)}
            type="soft"
        />
    ));

    return (
        <div
            className={classNames({
                'block-crud-buttons': true,
                'flex-center': true,
                active,
            })}
        >
            {collapseCellButtonDOM}
            {cellEditButtonsDOM}
            {insertCellButtons}
        </div>
    );
};
