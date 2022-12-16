import React, { useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';

import { useQueryCells } from 'hooks/dataDoc/useQueryCells';
import { useMakeSelector } from 'hooks/redux/useMakeSelector';
import { sendConfirm } from 'lib/querybookUI';
import { makeLatestQueryExecutionsSelector } from 'redux/queryExecutions/selector';
import { DataDocResource } from 'resource/dataDoc';
import { IconButton } from 'ui/Button/IconButton';
import { Message } from 'ui/Message/Message';

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

    const ConfirmMessageDOM = useCallback(
        () => (
            <div>
                {hasQueryRunning && (
                    <Message type="warning" className="mb8">
                        There are some query cells still running. Do you want to
                        run anyway?
                    </Message>
                )}
                <div>
                    {`You will be executing ${queryCells.length} query cells sequentially. If any of them
                fails, the sequence of execution will be stopped.`}
                </div>
            </div>
        ),
        [queryCells.length, hasQueryRunning]
    );

    const onRunAll = useCallback(() => {
        sendConfirm({
            header: 'Run All Cells',
            message: ConfirmMessageDOM(),
            onConfirm: () => {
                toast.promise(DataDocResource.run(docId), {
                    loading: null,
                    success: 'DataDoc execution started!',
                    error: 'Failed to start the execution',
                });
            },
            confirmText: 'Run',
        });
    }, [ConfirmMessageDOM, docId]);

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
