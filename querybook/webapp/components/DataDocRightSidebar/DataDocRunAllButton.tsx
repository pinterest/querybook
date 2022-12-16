import React, { useCallback } from 'react';
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
    const hasQueryRunning = latestQueryExecutions.some((q) => q.status < 3);

    const ConfirmMessageDOM = useCallback(
        () => (
            <div>
                <div>
                    {`You will be executing ${queryCells.length} query cells sequentially. If any of them
                fails, the sequence of execution will be stopped.`}
                </div>
                {hasQueryRunning && (
                    <Message type="warning" className="mt8">
                        There are some query cells still running. Do you want to
                        run anyway?
                    </Message>
                )}
            </div>
        ),
        [queryCells.length, hasQueryRunning]
    );

    const onRunAll = useCallback(() => {
        sendConfirm({
            header: 'Run All Cells',
            message: ConfirmMessageDOM(),
            onConfirm: () => {
                DataDocResource.run(docId).then(() => {
                    toast.success('DataDoc execution started!');
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
