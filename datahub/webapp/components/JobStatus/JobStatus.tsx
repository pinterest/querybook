import React from 'react';
import moment from 'moment';

import { IJobStatusRecord } from 'const/schedule';
import { generateFormattedDate } from 'lib/utils/datetime';
import ds, { ICancelablePromise } from 'lib/datasource';

import { SearchBar } from 'ui/SearchBar/SearchBar';
import { Table, TableAlign } from 'ui/Table/Table';
import { Button } from 'ui/Button/Button';
import './JobStatus.scss';
import { JobStatusIcon } from './JobStatusIcon';
import { useInterval } from 'hooks/useInterval';
import { Loading } from 'ui/Loading/Loading';
import { Tabs } from 'ui/Tabs/Tabs';
import { ToggleButton } from 'ui/ToggleButton/ToggleButton';
import { usePaginatedFetch } from 'hooks/usePaginatedFetch';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';

const PAGE_SIZE = 30;

const tableColumns: Array<keyof IJobStatusRecord> = [
    'id',
    'created_at',
    'updated_at',
    'name',
    'status',
];
const tableColumnWidths = {
    id: 80,
    created_at: 280,
    status: 120,
};
const tableColumnAligns: Record<string, TableAlign> = {
    id: 'center',
    created_at: 'center',
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

export interface IJobStatus {
    name?: string;
}

export const JobStatus: React.FunctionComponent<IJobStatus> = ({ name }) => {
    const [type, setType] = React.useState<'prod' | 'user'>('prod');
    const [nameSearchString, setNameSearchString] = React.useState(name || '');

    const [fetchInfo, setFetchInfo] = React.useState({
        numPage: 0,
        hideSuccessfulJobs: false,
    });
    const [autoRefresh, setAutoRefresh] = React.useState(false);

    const { data, isLoading, fetchMore, hasMore, reset } = usePaginatedFetch<
        IJobStatusRecord
    >({
        url: `/admin/schedule/record/`,
        batchSize: PAGE_SIZE,
        params: {
            hide_successful_jobs: fetchInfo.hideSuccessfulJobs,
            name: nameSearchString,
            task_type: type,
        },
    });

    useInterval(reset, 60 * 1000, !autoRefresh);

    const topDOM = (
        <>
            <div className="JobStatus-controls horizontal-space-between">
                <Tabs
                    selectedTabKey={type}
                    items={[
                        { name: 'Production', key: 'prod' },
                        { name: 'User', key: 'user' },
                    ]}
                    onSelect={(key: 'prod' | 'user') => {
                        setType(key);
                    }}
                />
                <div className="horizontal-space-between">
                    <SearchBar
                        value={nameSearchString}
                        placeholder="Filter by name"
                        onSearch={(s) =>
                            setNameSearchString(s.replace(' ', ''))
                        }
                    />
                    <div className="JobStatus-switch">
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
        <div className="JobStatus-more flex-column">
            <AsyncButton
                onClick={fetchMore}
                title="Show more rows"
                type="soft"
            />
        </div>
    );
    return (
        <div className="JobStatus">
            {topDOM}
            {tableDOM}
            {isLoading ? <Loading /> : null}
            {buttonDOM}
        </div>
    );
};
