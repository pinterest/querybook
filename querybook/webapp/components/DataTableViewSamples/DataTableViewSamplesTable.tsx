import React, { useState } from 'react';
import { useSelector } from 'react-redux';

import { useInterval } from 'hooks/useInterval';
import { IStoreState } from 'redux/store/types';
import { Loading } from 'ui/Loading/Loading';
import { ProgressBar } from 'ui/ProgressBar/ProgressBar';
import { EmptyText } from 'ui/StyledText/StyledText';

import { SamplesTableView } from './SamplesTableView';

export const DataTableViewSamplesTable: React.FC<{
    tableId: number;
    tableName: string;
    loadDataTableSamples: () => Promise<any>;
    pollDataTableSamples: () => Promise<any>;
}> = ({ tableId, loadDataTableSamples, pollDataTableSamples, tableName }) => {
    const [loading, setLoading] = useState(false);

    const samples = useSelector(
        (state: IStoreState) => state.dataSources.dataTablesSamplesById[tableId]
    );
    const poll = useSelector(
        (state: IStoreState) =>
            state.dataSources.dataTablesSamplesPollingById[tableId]
    );

    React.useEffect(() => {
        // Try to load the data initially
        if (samples == null) {
            setLoading(true);
            loadDataTableSamples().finally(() => setLoading(false));
        }
    }, [tableId]);

    useInterval(
        () => {
            pollDataTableSamples();
        },
        1000,
        !poll
    );

    const samplesTableDOM = loading ? (
        <Loading />
    ) : poll ? (
        <div className="center-align p12">
            <ProgressBar value={poll.progress} showValue />
        </div>
    ) : samples ? (
        <SamplesTableView tableName={tableName} samples={samples} />
    ) : (
        <EmptyText className="m24">
            Samples not found, Click "Generate" to create samples.
        </EmptyText>
    );

    return samplesTableDOM;
};
