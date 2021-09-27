import React, { useEffect, useMemo, useContext, useCallback } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import type { ContentState } from 'draft-js';

import { useSelector } from 'react-redux';

import { IDataCell, DataCellUpdateFields } from 'const/datadoc';
import { DataDocContext } from 'context/DataDoc';
import { useBoundFunc } from 'hooks/useBoundFunction';
import { useMakeSelector } from 'hooks/redux/useMakeSelector';

import { sendConfirm } from 'lib/querybookUI';
import { getShareUrl } from 'lib/data-doc/data-doc-utils';
import { formatError } from 'lib/utils/error';

import { IStoreState } from 'redux/store/types';
import * as dataDocSelectors from 'redux/dataDoc/selector';
import * as dataDocActions from 'redux/dataDoc/action';

import { DataDocCellWrapper } from 'components/DataDocCellWrapper/DataDocCellWrapper';
import { DataDocCellControl } from 'components/DataDoc/DataDocCellControl';
import { DataDocQueryCell } from 'components/DataDocQueryCell/DataDocQueryCell';
import { DataDocChartCell } from 'components/DataDocChartCell/DataDocChartCell';
import { DataDocTextCell } from 'components/DataDocTextCell/DataDocTextCell';
import { UserAvatar } from 'components/UserBadge/UserAvatar';

import './DataDocCell.scss';

interface IDataDocCellProps {
    docId: number;
    numberOfCells: number;
    templatedVariables: Record<string, string>;

    cell: IDataCell;
    index: number;
    lastQueryCellId: number;
    queryIndexInDoc: number;
    isFocused: boolean;
}

function getEstimatedCellHeight(cell: IDataCell) {
    if (Boolean(cell.meta['collapsed'])) {
        return 40;
    }

    // chart or query
    if (cell.cell_type !== 'text') {
        return 240;
    }
    return 80;
}

function isCellEmpty(cell: IDataCell): boolean {
    const cellType = cell.cell_type;
    if (cellType === 'query') {
        return cell.context === '';
    } else if (cellType === 'text') {
        return !(cell.context as ContentState).hasText();
    }

    return false;
}

// renders cell
export const DataDocCell: React.FunctionComponent<IDataDocCellProps> = React.memo(
    ({
        docId,
        numberOfCells,
        templatedVariables,

        cell,
        index,
        lastQueryCellId,
        queryIndexInDoc,
        isFocused,
    }) => {
        const {
            cellIdToExecutionId,

            insertCellAt,
            updateCell,
            copyCellAt,
            pasteCellAt,
            fullScreenCellAt,

            cellFocus,
            defaultCollapse,
            isEditable,
            highlightCellIndex,
            fullScreenCellIndex,
        } = useContext(DataDocContext);

        const cellIdtoUid = useMakeSelector(
            dataDocSelectors.makeDataDocCursorByCellIdSelector,
            docId
        );

        const arrowKeysEnabled = useSelector(
            (state: IStoreState) =>
                state.user.computedSettings.datadoc_arrow_key === 'enabled'
        );

        const [showCollapsed, setShowCollapsed] = React.useState(undefined);
        useEffect(() => {
            if (defaultCollapse != null) {
                setShowCollapsed(defaultCollapse);
            } else {
                setShowCollapsed(
                    cell.cell_type === 'query'
                        ? Boolean(cell.meta.collapsed)
                        : undefined
                );
            }
        }, [defaultCollapse, cell.meta.collapsed, cell.cell_type]);
        const uncollapseCell = useCallback(() => setShowCollapsed(false), []);

        const handleUpdateCell = React.useCallback(
            async (fields: DataCellUpdateFields) => updateCell(cell.id, fields),
            [cell.id, updateCell]
        );

        const handleMoveCell = React.useCallback(
            (fromIndex: number, toIndex: number) => {
                dataDocActions.moveDataDocCell(docId, fromIndex, toIndex);
            },
            [docId]
        );

        const handleDefaultCollapseChange = React.useCallback(
            () =>
                handleUpdateCell({
                    meta: { ...cell.meta, collapsed: !cell.meta.collapsed },
                }),
            [cell.meta, handleUpdateCell]
        );

        const cellIsEmpty = useMemo(() => isCellEmpty(cell), [cell]);
        const handleDeleteCell = React.useCallback(
            () =>
                new Promise<void>((resolve) => {
                    if (numberOfCells > 0) {
                        const shouldConfirm = !cellIsEmpty;
                        const deleteCell = async () => {
                            try {
                                await dataDocActions.deleteDataDocCell(
                                    docId,
                                    cell.id
                                );
                            } catch (e) {
                                toast.error(
                                    `Delete cell failed, reason: ${formatError(
                                        e
                                    )}`
                                );
                            } finally {
                                resolve();
                            }
                        };
                        if (shouldConfirm) {
                            sendConfirm({
                                header: 'Delete Cell?',
                                message: 'Deleted cells cannot be recovered',
                                onConfirm: deleteCell,
                                onHide: resolve,
                            });
                        } else {
                            deleteCell().finally(resolve);
                        }
                    } else {
                        resolve();
                    }
                }),
            [docId, numberOfCells, cell.id, cellIsEmpty]
        );

        const shareUrl = useMemo(
            () => getShareUrl(cell.id, cellIdToExecutionId[cell.id]),
            [cell.id, cellIdToExecutionId[cell.id]]
        );

        const isFullScreen = index === fullScreenCellIndex;
        const toggleFullScreen = useCallback(() => {
            fullScreenCellAt(isFullScreen ? null : index);
        }, [isFullScreen, fullScreenCellAt, index]);
        const handleFocus = useBoundFunc(cellFocus.onFocus, index);
        const handleBlur = useBoundFunc(cellFocus.onBlur, index);
        const handleUpKeyPressed = useBoundFunc(
            cellFocus.onUpKeyPressed,
            index
        );
        const handleDownKeyPressed = useBoundFunc(
            cellFocus.onDownKeyPressed,
            index
        );

        const renderCell = () => {
            const onCellKeyArrowKeyPressed = arrowKeysEnabled
                ? {
                      onUpKeyPressed: handleUpKeyPressed,
                      onDownKeyPressed: handleDownKeyPressed,
                  }
                : {};

            // If we are printing, then print readonly cells
            const cellProps = {
                meta: cell.meta,
                isEditable,

                shouldFocus: isFocused,
                showCollapsed,

                onChange: handleUpdateCell,
                onDeleteKeyPressed: handleDeleteCell,

                onFocus: handleFocus,
                onBlur: handleBlur,
                ...onCellKeyArrowKeyPressed,
            };

            let cellDOM = null;
            if (cell.cell_type === 'query') {
                const allProps = {
                    ...cellProps,
                    query: cell.context,
                    docId,
                    cellId: cell.id,
                    queryIndexInDoc,
                    templatedVariables,
                    isFullScreen,
                    toggleFullScreen,
                };
                cellDOM = <DataDocQueryCell {...allProps} />;
            } else if (cell.cell_type === 'chart') {
                cellDOM = (
                    <DataDocChartCell
                        {...cellProps}
                        previousQueryCellId={lastQueryCellId}
                        context={cell.context}
                        meta={cell.meta}
                        dataDocId={docId}
                    />
                );
            } else if (cell.cell_type === 'text') {
                // default text
                cellDOM = (
                    <DataDocTextCell
                        {...cellProps}
                        cellId={cell.id}
                        context={cell.context}
                    />
                );
            }

            return cellDOM;
        };

        const renderCellControlDOM = (idx: number, isHeaderParam: boolean) => (
            <div className={'data-doc-cell-divider-container'}>
                <DataDocCellControl
                    index={idx}
                    numberOfCells={numberOfCells}
                    moveCellAt={handleMoveCell}
                    pasteCellAt={pasteCellAt}
                    copyCellAt={copyCellAt}
                    insertCellAt={insertCellAt}
                    deleteCellAt={handleDeleteCell}
                    isHeader={isHeaderParam}
                    isEditable={isEditable}
                    showCollapsed={showCollapsed}
                    setShowCollapsed={setShowCollapsed}
                    isCollapsedDefault={
                        Boolean(cell.meta.collapsed) === showCollapsed
                    }
                    toggleDefaultCollapsed={handleDefaultCollapseChange}
                    shareUrl={shareUrl}
                />
            </div>
        );
        const uids = cellIdtoUid[cell.id] || [];
        const uidDOM = uids.map((uid) => (
            <UserAvatar key={uid} uid={uid} tiny />
        ));
        const dataDocCellClassName = showCollapsed
            ? 'DataDocCell collapsed'
            : 'DataDocCell';
        const innerCellClassName = clsx({
            'highlight-cell': highlightCellIndex === index,
            'data-doc-cell-container-pair': true,
        });

        const innerCellContentDOM = (
            <div className={innerCellClassName}>
                <div className="data-doc-cell-users flex-column">{uidDOM}</div>
                {renderCellControlDOM(index, true)}
                <div
                    className={dataDocCellClassName}
                    onClick={showCollapsed ? uncollapseCell : null}
                >
                    {renderCell()}
                </div>
                {renderCellControlDOM(index + 1, false)}
            </div>
        );

        return (
            <DataDocCellWrapper
                cellKey={String(cell.id)}
                placeholderHeight={getEstimatedCellHeight(cell)}
                key={cell.id}
            >
                {innerCellContentDOM}
            </DataDocCellWrapper>
        );
    }
);
