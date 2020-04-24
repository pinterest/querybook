import React from 'react';
import moment from 'moment';

import { ITaskStatusRecord } from 'const/schedule';
import { generateFormattedDate } from 'lib/utils/datetime';
import { usePaginatedFetch } from 'hooks/usePaginatedFetch';

import { useInterval } from 'hooks/useInterval';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Loading } from 'ui/Loading/Loading';
import { Table, TableAlign } from 'ui/Table/Table';
import { Tabs } from 'ui/Tabs/Tabs';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { TaskStatusIcon } from './TaskStatusIcon';
import { ToggleButton } from 'ui/ToggleButton/ToggleButton';

import './TaskStatus.scss';

const PAGE_SIZE = 30;

const tableColumns: Array<keyof ITaskStatusRecord> = [
    'id',
    'name',
    'created_at',
    'updated_at',
    'status',
];
const tableColumnWidths = {
    id: 80,
    name: 240,
    created_at: 240,
    updated_at: 240,
    status: 120,
};
const tableColumnAligns: Record<string, TableAlign> = {
    id: 'center',
    created_at: 'center',
    updated_at: 'center',
    status: 'center',
};

function formatCell(
    index: number,
    column: keyof ITaskStatusRecord,
    row: ITaskStatusRecord
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
            return <TaskStatusIcon type={value} />;
        }
        default:
            return row[column];
    }
}

export interface ITaskStatusProps {
    taskId?: number;
    taskName?: string;
}

export const TaskStatus: React.FunctionComponent<ITaskStatusProps> = ({
    taskId,
    taskName,
}) => {
    const [type, setType] = React.useState<'prod' | 'user'>('prod');
    const [nameSearchString, setNameSearchString] = React.useState(
        taskName || ''
    );

    const [fetchInfo, setFetchInfo] = React.useState({
        numPage: 0,
        hideSuccessfulJobs: false,
    });
    const [autoRefresh, setAutoRefresh] = React.useState(false);

    const {
        data: taskRecords,
        isLoading,
        fetchMore,
        hasMore,
        reset,
    } = usePaginatedFetch<ITaskStatusRecord>({
        url: taskId
            ? `/admin/schedule/${taskId}/record/`
            : `/admin/schedule/record/`,
        batchSize: PAGE_SIZE,
        params: taskId
            ? {
                  hide_successful_jobs: fetchInfo.hideSuccessfulJobs,
              }
            : {
                  hide_successful_jobs: fetchInfo.hideSuccessfulJobs,
                  name: nameSearchString,
                  task_type: type,
              },
    });

    useInterval(reset, 60 * 1000, !autoRefresh);

    const topDOM = (
        <>
            <div
                className={`TaskStatus-controls ${
                    taskId ? 'right-align' : 'horizontal-space-between'
                }`}
            >
                {taskId ? null : (
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
                )}
                <div className="flex-row">
                    {taskId ? null : (
                        <SearchBar
                            value={nameSearchString}
                            placeholder="Filter by name"
                            onSearch={(s) =>
                                setNameSearchString(s.replace(' ', ''))
                            }
                        />
                    )}
                    <div className="TaskStatus-switch">
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
            rows={taskRecords || []}
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
    return (
        <div className="TaskStatus">
            {topDOM}
            {tableDOM}
            {isLoading ? <Loading /> : null}
            {buttonDOM}
        </div>
    );
};
