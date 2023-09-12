import React, { useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';

import { ComponentType, ElementType } from 'const/analytics';
import { useQueryCells } from 'hooks/dataDoc/useQueryCells';
import { useMakeSelector } from 'hooks/redux/useMakeSelector';
import { trackClick } from 'lib/analytics';
import { sendConfirm } from 'lib/querybookUI';
import { makeLatestQueryExecutionsSelector } from 'redux/queryExecutions/selector';
import { DataDocResource } from 'resource/dataDoc';
import { IconButton } from 'ui/Button/IconButton';

import { DataDocRunAllButtonConfirm } from './DataDocRunAllButtonConfirm';

interface IProps {
    docId: number;
}

export const DataDocRunAllButton: React.FunctionComponent<IProps> = ({
    docId,
}) => {
    const queryCells = useQueryCells(docId);
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
            header: 'Run All Cells',
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
                    element: ElementType.RUN_ALL_CELLS_BUTTON,
                });
                toast.promise(
                    DataDocResource.run(docId, notification.current),
                    {
                        loading: null,
                        success: 'DataDoc execution started!',
                        error: 'Failed to start the execution',
                    }
                );
            },
            confirmText: 'Run',
        });
    }, [docId, hasQueryRunning, notification, queryCells]);

    return (
        <IconButton
            icon="PlayCircle"
            onClick={onRunAll}
            tooltip="Run all cells in the doc"
            tooltipPos="left"
            title="Run All"
        />
    );
};
