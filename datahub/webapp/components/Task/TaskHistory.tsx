import * as React from 'react';
import { IJobStatusRecord } from 'const/schedule';
import { usePaginatedFetch } from 'hooks/usePaginatedFetch';
import { useInterval } from 'hooks/useInterval';
import { Tabs } from 'ui/Tabs/Tabs';
import { ToggleButton } from 'ui/ToggleButton/ToggleButton';
import { Table, TableAlign } from 'ui/Table/Table';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Loading } from 'ui/Loading/Loading';
import { generateFormattedDate } from 'lib/utils/datetime';
import moment from 'moment';
import { JobStatusIcon } from 'components/JobStatus/JobStatusIcon';

import './TaskHistory.scss';

const PAGE_SIZE = 30;

const tableColumns: Array<keyof IJobStatusRecord> = [
    'id',
    'created_at',
    'updated_at',
    'status',
];
const tableColumnWidths = {
    id: 80,
};
const tableColumnAligns: Record<string, TableAlign> = {
    id: 'center',
    created_at: 'center',
    updated_at: 'center',
    status: 'center',
};

function formatCell(
    index: number,
    column: keyof IJobStatusRecord,
    row: IJobStatusRecord
) {
    switch (column) {
        case 'updated_at':
        case 'created_at': {
            const value = row[column];
            return `${generateFormattedDate(value, 'X')}, ${moment
                .utc(value, 'X')
                .fromNow()}`;
        }
        case 'name': {
            const value = row[column];
            return <b>{value}</b>;
        }
        case 'status': {
            const value = row[column];
            return <JobStatusIcon type={value} />;
        }
        default:
            return row[column];
    }
}

interface IProps {
    taskName: string;
}

export const TaskHistory: React.FunctionComponent<IProps> = ({ taskName }) => {
    const [fetchInfo, setFetchInfo] = React.useState({
        numPage: 0,
        hideSuccessfulJobs: false,
    });
    const [autoRefresh, setAutoRefresh] = React.useState(false);

    const { data, isLoading, fetchMore, hasMore, reset } = usePaginatedFetch<
        IJobStatusRecord
    >({
        url: `/admin/schedule/record/history/`,
        batchSize: PAGE_SIZE,
        params: {
            hide_successful_jobs: fetchInfo.hideSuccessfulJobs,
            name: taskName,
        },
    });

    useInterval(reset, 60 * 1000, !autoRefresh);

    const topDOM = (
        <>
            <div className="TaskHistory-controls horizontal-space-between">
                <div className="horizontal-space-between">
                    <div className="TaskHistory-switch">
                        <ToggleButton
                            checked={autoRefresh}
                            onChange={setAutoRefresh}
                            title="Auto-Refresh"
                        />
                        <ToggleButton
                            checked={fetchInfo.hideSuccessfulJobs}
                            onChange={(hideSuccessfulJobs) => {
                                setFetchInfo({
                                    ...fetchInfo,
                                    hideSuccessfulJobs,
                                });
                            }}
                            title="Hide Succes"
                        />
                    </div>
                </div>
            </div>
        </>
    );

    const tableDOM = (
        <Table
            rows={data || []}
            cols={tableColumns}
            formatCell={formatCell}
            colNameToWidths={tableColumnWidths}
            colNameToTextAlign={tableColumnAligns}
            showAllRows={true}
        />
    );

    const buttonDOM = hasMore && (
        <div className="mt24 center-align">
            <AsyncButton
                onClick={fetchMore}
                title="Show more rows"
                type="soft"
            />
        </div>
    );
    console.log('data', data);
    return (
        <div className="TaskHistory">
            {topDOM}
            {tableDOM}
            {isLoading ? <Loading /> : null}
            {buttonDOM}
        </div>
    );
};
