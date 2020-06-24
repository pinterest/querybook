import React from 'react';
import moment from 'moment';

import { ITaskStatusRecord } from 'const/schedule';
import { generateFormattedDate } from 'lib/utils/datetime';
import { useDataFetch } from 'hooks/useDataFetch';
import { Loading } from 'ui/Loading/Loading';
import { ErrorMessage } from 'ui/Message/ErrorMessage';
import { Table } from 'ui/Table/Table';
import { TaskStatusIcon } from 'components/Task/TaskStatusIcon';

function formatCell(
    index: number,
    column: keyof ITaskStatusRecord,
    row: ITaskStatusRecord
) {
    const value = row[column];
    let dom: React.ReactNode = value;
    switch (column) {
        case 'updated_at':
        case 'created_at': {
            dom = generateFormattedDate(row[column], 'X');
            break;
        }
        case 'name': {
            dom = <b>{value}</b>;
            break;
        }
        case 'status': {
            dom = <TaskStatusIcon type={row[column]} />;
            break;
        }
    }
    return (
        <div key={`${row.id}-${column}`} className={`col-${column}`}>
            {dom}
        </div>
    );
}

const runLogsColumns: Array<keyof ITaskStatusRecord> = [
    'id',
    'created_at',
    'updated_at',
    'status',
    'error_message',
];
const runLogsColumnsWidth: Partial<Record<keyof ITaskStatusRecord, number>> = {
    id: 1,
    created_at: 2,
    updated_at: 2,
    status: 1,
    error_message: 5,
};

export const DataDocScheduleRunLogs: React.FunctionComponent<{
    docId: number;
}> = ({ docId }) => {
    const { isLoading, isError, data } = useDataFetch<ITaskStatusRecord[]>({
        url: `/datadoc/${docId}/schedule/logs/`,
    });

    if (isLoading) {
        return <Loading />;
    }

    if (isError) {
        return <ErrorMessage>Error Loading DataDoc Schedule</ErrorMessage>;
    }

    return (
        <Table
            rows={data}
            cols={runLogsColumns}
            formatCell={formatCell}
            showAllRows={true}
            colNameToWidths={runLogsColumnsWidth}
        />
    );
};
