import React, { useCallback } from 'react';
import toast from 'react-hot-toast';

import { useQueryCells } from 'hooks/dataDoc/useQueryCells';
import { useMakeSelector } from 'hooks/redux/useMakeSelector';
import { sendConfirm } from 'lib/querybookUI';
import { makeLatestQueryExecutionsSelector } from 'redux/queryExecutions/selector';
import { DataDocResource } from 'resource/dataDoc';
import { IconButton } from 'ui/Button/IconButton';

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

    const runAll = useCallback(
        () =>
            DataDocResource.run(docId).then(() => {
                toast.success('DataDoc execution started!');
            }),
        [docId]
    );

    const onRunAll = useCallback(() => {
        if (latestQueryExecutions.some((q) => q.status < 3)) {
            sendConfirm({
                header: 'Run All Cells',
                message:
                    'At least one of the query cell is still running. Do you want to run anyway?',
                onConfirm: () => {
                    runAll();
                },
                confirmText: 'Run Anyway',
            });
        } else {
            runAll();
        }
    }, [latestQueryExecutions, runAll]);

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
