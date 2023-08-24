import clsx from 'clsx';
import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
} from 'react';
import { useSelector } from 'react-redux';

import { DataDocCellControl } from 'components/DataDoc/DataDocCellControl';
import { DataDocCellWrapper } from 'components/DataDocCellWrapper/DataDocCellWrapper';
import { DataDocChartCell } from 'components/DataDocChartCell/DataDocChartCell';
import { DataDocQueryCell } from 'components/DataDocQueryCell/DataDocQueryCell';
import { DataDocTextCell } from 'components/DataDocTextCell/DataDocTextCell';
import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { ComponentType, ElementType } from 'const/analytics';
import {
    DataCellUpdateFields,
    IDataCell,
    TDataDocMetaVariables,
} from 'const/datadoc';
import { DataDocContext } from 'context/DataDoc';
import { useMakeSelector } from 'hooks/redux/useMakeSelector';
import { useBoundFunc } from 'hooks/useBoundFunction';
import { trackClick } from 'lib/analytics';
import { getShareUrl } from 'lib/data-doc/data-doc-utils';
import * as dataDocActions from 'redux/dataDoc/action';
import * as dataDocSelectors from 'redux/dataDoc/selector';
import { IStoreState } from 'redux/store/types';
import { useQueryCells } from '../../hooks/dataDoc/useQueryCells';
import { makeLatestQueryExecutionsSelector } from '../../redux/queryExecutions/selector';
import { sendConfirm } from '../../lib/querybookUI';
import { DataDocRunAllButtonConfirm } from '../DataDocRightSidebar/DataDocRunAllButtonConfirm';
import toast from 'react-hot-toast';
import { DataDocResource } from '../../resource/dataDoc';

import './DataDocCell.scss';

interface IDataDocCellProps {
    docId: number;
    numberOfCells: number;
    templatedVariables: TDataDocMetaVariables;

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

// renders cell
export const DataDocCell: React.FunctionComponent<IDataDocCellProps> =
    React.memo(
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
                deleteCellAt,
                fullScreenCellAt,

                cellFocus,
                defaultCollapse,
                isEditable,
                highlightCellIndex,
                fullScreenCellIndex,
            } = useContext(DataDocContext);

            let queryCells = useQueryCells(docId);
            const queryTitle = queryCells[index].meta.title;
            const title =
                queryTitle == null || queryTitle === ''
                    ? 'Query #' + (index + 1).toString()
                    : queryTitle;
            queryCells = queryCells.slice(index);

            const latestQueryExecutions = useMakeSelector(
                makeLatestQueryExecutionsSelector,
                queryCells.map((c) => c.id) ?? []
            );
            const hasQueryRunning = useMemo(
                () => latestQueryExecutions.some((q) => q.status < 3),
                [latestQueryExecutions]
            );
            const notification = useRef(true);

            const onRunAll = useCallback(() => {
                sendConfirm({
                    header: 'Run Cells From ' + title,
                    message: (
                        <DataDocRunAllButtonConfirm
                            defaultNotification={notification.current}
                            onNotificationChange={(value) => {
                                notification.current = value;
                            }}
                            hasQueryRunning={hasQueryRunning}
                            queryCells={queryCells}
                        />
                    ),
                    onConfirm: () => {
                        trackClick({
                            component: ComponentType.DATADOC_PAGE,
                            element: ElementType.RUN_ALL_FROM_CELL_BUTTON,
                        });
                        toast.promise(
                            DataDocResource.run(
                                docId,
                                notification.current,
                                index
                            ),
                            {
                                loading: null,
                                success: 'DataDoc execution started!',
                                error: 'Failed to start the execution',
                            }
                        );
                    },
                    confirmText: 'Run',
                });
                return null;
            }, [docId, hasQueryRunning, notification, queryCells]);

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
            const uncollapseCell = useCallback(
                () => setShowCollapsed(false),
                []
            );

            const handleUpdateCell = React.useCallback(
                async (fields: DataCellUpdateFields) =>
                    updateCell(cell.id, fields),
                [cell.id, updateCell]
            );

            const handleMoveCell = React.useCallback(
                (fromIndex: number, toIndex: number) => {
                    trackClick({
                        component: ComponentType.DATADOC_PAGE,
                        element: ElementType.MOVE_CELL_BUTTON,
                    });
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
                        onRunAll,
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

            const renderCellControlDOM = (
                idx: number,
                isHeaderParam: boolean
            ) => (
                <div className={'data-doc-cell-divider-container'}>
                    <DataDocCellControl
                        index={idx}
                        cellId={cell.id}
                        numberOfCells={numberOfCells}
                        moveCellAt={handleMoveCell}
                        pasteCellAt={pasteCellAt}
                        copyCellAt={copyCellAt}
                        insertCellAt={insertCellAt}
                        deleteCellAt={deleteCellAt}
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
                    <div className="data-doc-cell-users flex-column">
                        {uidDOM}
                    </div>
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
