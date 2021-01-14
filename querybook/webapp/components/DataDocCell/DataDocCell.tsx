import React, { useEffect, useMemo, useContext, useCallback } from 'react';
import classNames from 'classnames';
import toast from 'react-hot-toast';

import { useSelector } from 'react-redux';
import { IStoreState } from 'redux/store/types';
import { IDataCell, IDataDoc, DataCellUpdateFields } from 'const/datadoc';
import { DataDocContext } from 'context/DataDoc';

import { sendConfirm } from 'lib/querybookUI';
import { getShareUrl } from 'lib/data-doc/data-doc-utils';

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
    dataDoc: IDataDoc;
    cell: IDataCell;
    index: number;
    lastQueryCellId: number;
    queryIndexInDoc: number;
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
export const DataDocCell: React.FunctionComponent<IDataDocCellProps> = ({
    dataDoc,
    cell,
    index,
    lastQueryCellId,
    queryIndexInDoc,
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
        focusedCellIndex,
        isEditable,
        highlightCellIndex,
        fullScreenCellIndex,
    } = useContext(DataDocContext);
    const { cellIdtoUid, arrowKeysEnabled } = useSelector(
        (state: IStoreState) => ({
            cellIdtoUid: dataDocSelectors.dataDocCursorByCellIdSelector(state, {
                docId: dataDoc.id,
            }),
            arrowKeysEnabled:
                state.user.computedSettings.datadoc_arrow_key === 'enabled',
        })
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
    }, [defaultCollapse]);

    const uncollapseCell = () => setShowCollapsed(false);

    const updateCellAt = React.useCallback(
        async (fields: DataCellUpdateFields) => updateCell(cell.id, fields),
        [cell.id]
    );

    const handleDefaultCollapseChange = React.useCallback(
        () =>
            updateCellAt({
                meta: { ...cell.meta, collapsed: !cell.meta.collapsed },
            }),
        [cell]
    );

    const deleteCellAt = React.useCallback(
        () =>
            new Promise<void>((resolve) => {
                const dataDocCells = dataDoc.dataDocCells;
                const numberOfCells = (dataDocCells || []).length;

                if (numberOfCells > 0) {
                    const deleteCell = async () => {
                        try {
                            await dataDocActions.deleteDataDocCell(
                                dataDoc.id,
                                index
                            );
                        } catch (e) {
                            toast.error(`Delete cell failed, reason: ${e}`);
                        } finally {
                            resolve();
                        }
                    };
                    sendConfirm({
                        header: 'Delete Cell?',
                        message: 'Deleted cells cannot be recovered',
                        onConfirm: deleteCell,
                        onHide: resolve,
                    });
                } else {
                    resolve();
                }
            }),
        [dataDoc]
    );

    const shareUrl = useMemo(
        () => getShareUrl(cell.id, cellIdToExecutionId[cell.id]),
        [cell.id, cellIdToExecutionId[cell.id]]
    );

    const isFullScreen = index === fullScreenCellIndex;
    const toggleFullScreen = useCallback(() => {
        fullScreenCellAt(isFullScreen ? null : index);
    }, [isFullScreen, fullScreenCellAt, index]);

    const renderCell = () => {
        const onCellFocusOrBlur = {
            onFocus: cellFocus.onFocus.bind(null, index),
            onBlur: cellFocus.onBlur.bind(null, index),
        };
        const onCellKeyArrowKeyPressed = arrowKeysEnabled
            ? {
                  onUpKeyPressed: cellFocus.onUpKeyPressed.bind(null, index),
                  onDownKeyPressed: cellFocus.onDownKeyPressed.bind(
                      null,
                      index
                  ),
              }
            : {};

        // If we are printing, then print readonly cells
        const cellProps = {
            meta: cell.meta,
            isEditable,

            shouldFocus: focusedCellIndex === index,
            showCollapsed,

            onChange: updateCellAt,
            onDeleteKeyPressed: deleteCellAt,

            ...onCellFocusOrBlur,
            ...onCellKeyArrowKeyPressed,
        };

        let cellDOM = null;
        if (cell.cell_type === 'query') {
            const allProps = {
                ...cellProps,
                query: cell.context,
                docId: dataDoc.id,
                cellId: cell.id,
                queryIndexInDoc,
                templatedVariables: dataDoc.meta,
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
                    dataDocId={dataDoc.id}
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
                numberOfCells={dataDoc.dataDocCells.length}
                moveCellAt={dataDocActions.moveDataDocCell.bind(
                    null,
                    dataDoc.id
                )}
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
    const uidDOM = uids.map((uid) => <UserAvatar key={uid} uid={uid} tiny />);
    const dataDocCellClassName = showCollapsed
        ? 'DataDocCell collapsed'
        : 'DataDocCell';
    const innerCellClassName = classNames({
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
};
