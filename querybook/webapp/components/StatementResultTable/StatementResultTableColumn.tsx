import clsx from 'clsx';
import React, { useState, useCallback, useMemo, useRef } from 'react';

import { IColumnTransformer } from 'lib/query-result/types';
import { Level } from 'ui/Level/Level';
import { IconButton } from 'ui/Button/IconButton';
import {
    ColumnInfoTabType,
    StatementResultColumnInfo,
} from './StatementResultColumnInfo';
import { IFilterCondition, conditionsNotEmpty } from './useFilterCell';
import { withBoundProps } from 'lib/utils/react-bind';
import { Popover } from 'ui/Popover/Popover';

interface IStatementResultTableColumnProps
    extends IColumnInfoDropdownButtonProps {
    column: string;
    expandedColumn: Record<string, boolean>;
    toggleExpandedColumn: (c: string) => any;
}
export const StatementResultTableColumn: React.FC<IStatementResultTableColumnProps> = ({
    column,
    expandedColumn,
    toggleExpandedColumn,

    colIndex,
    colType,
    filteredRows,
    isPreview,
    columnTransformer,
    setTransformerForColumn,
    filterCondition,
    setFilterCondition,
}) => {
    const isExpanded = column in expandedColumn;

    const handleExpandColumnClick = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();

            toggleExpandedColumn(column);
        },
        [toggleExpandedColumn, column]
    );

    return (
        <Level className="result-table-header">
            <span
                className={`statement-result-table-title one-line-ellipsis ${
                    isExpanded ? 'expanded' : ''
                }`}
            >
                {column}
            </span>
            <div className="flex-row">
                <IconButton
                    className={clsx({
                        'column-button': true,
                        'expand-column-button': true,
                        'hidden-button': !isExpanded,
                    })}
                    noPadding
                    icon={isExpanded ? 'minimize-2' : 'maximize-2'}
                    size={14}
                    onClick={handleExpandColumnClick}
                />
                <ColumnInfoDropdownButton
                    column={column}
                    colIndex={colIndex}
                    colType={colType}
                    filteredRows={filteredRows}
                    isPreview={isPreview}
                    columnTransformer={columnTransformer}
                    setTransformerForColumn={setTransformerForColumn}
                    filterCondition={filterCondition}
                    setFilterCondition={setFilterCondition}
                />
            </div>
        </Level>
    );
};

interface IColumnInfoDropdownButtonProps {
    column: string;
    colIndex: number;
    colType: string;
    filteredRows: any[][];
    isPreview: boolean;
    columnTransformer?: IColumnTransformer;
    setTransformerForColumn: (
        index: number,
        transformer: IColumnTransformer
    ) => any;

    filterCondition?: IFilterCondition;
    setFilterCondition: (colIndex: number, condition: IFilterCondition) => void;
}
const ColumnInfoDropdownButton: React.FC<IColumnInfoDropdownButtonProps> = ({
    column,
    colIndex,
    colType,
    filteredRows,
    isPreview,
    columnTransformer,
    setTransformerForColumn,

    filterCondition,
    setFilterCondition,
}) => {
    const [showPopover, setShowPopover] = useState(false);
    const selfRef = useRef<HTMLAnchorElement>(null);
    const [columnInfoTab, setColumnInfoTab] = useState<ColumnInfoTabType>(
        'main'
    );

    const boundSetTransformerForColumn = useCallback(
        (transformer: IColumnTransformer | null) =>
            setTransformerForColumn(colIndex, transformer),
        [setTransformerForColumn, colIndex]
    );

    const boundSetFilterCondition = useCallback(
        (condition: IFilterCondition | null) => {
            setFilterCondition(colIndex, condition);
        },
        [setFilterCondition, colIndex]
    );

    const filterConditionExists = useMemo(
        () => filterCondition && conditionsNotEmpty(filterCondition),
        [filterCondition]
    );

    const getStatusIconsDOM = () => {
        const iconDOMs = [];
        if (columnTransformer) {
            iconDOMs.push(<ActiveStatusIcon icon="zap" key="zap" />);
        }
        if (filterConditionExists) {
            iconDOMs.push(<ActiveStatusIcon icon="filter" key="filter" />);
        }
        return iconDOMs;
    };

    const menuButtonDOM = (
        <span
            className="flex-row column-menu-buttons"
            onClick={(e) => {
                e.stopPropagation();
                setShowPopover(true);
            }}
        >
            {getStatusIconsDOM()}
            <IconButton
                ref={selfRef}
                className={clsx({
                    'column-button': true,
                    'hidden-button': !showPopover,
                })}
                noPadding
                icon={'menu'}
                active={showPopover}
                size={14}
            />
        </span>
    );

    const popoverDOM = showPopover && (
        <Popover
            anchor={selfRef?.current}
            onHide={() => setShowPopover(false)}
            layout={['top', 'right']}
            resizeOnChange
            hideArrow
        >
            <div
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                <StatementResultColumnInfo
                    filteredRows={filteredRows}
                    colName={column}
                    colIndex={colIndex}
                    colType={colType}
                    isPreview={isPreview}
                    setTransformer={boundSetTransformerForColumn}
                    transformer={columnTransformer}
                    filterCondition={filterCondition}
                    setFilterCondition={boundSetFilterCondition}
                    tab={columnInfoTab}
                    setTab={setColumnInfoTab}
                />
            </div>
        </Popover>
    );

    return (
        <>
            {menuButtonDOM}
            {popoverDOM}
        </>
    );
};

const ActiveStatusIcon = withBoundProps(IconButton, {
    className: 'column-button active-button',
    noPadding: true,
    size: 14,
});
