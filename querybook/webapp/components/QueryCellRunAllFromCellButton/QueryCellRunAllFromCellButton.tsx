import React, { useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';

import { ComponentType, ElementType } from 'const/analytics';
import { useQueryCells } from 'hooks/dataDoc/useQueryCells';
import { useMakeSelector } from 'hooks/redux/useMakeSelector';
import { trackClick } from 'lib/analytics';
import { sendConfirm } from 'lib/querybookUI';
import { makeLatestQueryExecutionsSelector } from 'redux/queryExecutions/selector';
import { DataDocResource } from 'resource/dataDoc';

import { AsyncButton } from '../../ui/AsyncButton/AsyncButton';
import { Icon } from '../../ui/Icon/Icon';
import { DataDocRunAllButtonConfirm } from '../DataDocRightSidebar/DataDocRunAllButtonConfirm';

interface IProps {
    docId: number;
    enabled: boolean;
    index: number;
}

export const QueryCellRunAllFromCellButton: React.FunctionComponent<IProps> = ({
    docId,
    enabled,
    index,
}) => {
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
                    DataDocResource.run(docId, notification.current, index),
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

    return (
        enabled && (
            <AsyncButton
                icon={<Icon name="FastForward" />}
                aria-label={'Run All Cells From Here'}
                data-balloon-pos={'up'}
                color={'accent'}
                onClick={onRunAll}
                style={{ width: '60px' }}
            />
        )
    );
};
