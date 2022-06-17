import React from 'react';

import { TaskStatusIcon } from 'components/Task/TaskStatusIcon';
import { ITaskStatusRecord } from 'const/schedule';
import { useResource } from 'hooks/useResource';
import { generateFormattedDate } from 'lib/utils/datetime';
import { DataDocScheduleResource } from 'resource/dataDoc';
import { Loading } from 'ui/Loading/Loading';
import { ErrorMessage } from 'ui/Message/ErrorMessage';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';
import { Table, TableAlign } from 'ui/Table/Table';

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
        case 'error_message': {
            dom = <ShowMoreText text={row[column]} />;
            break;
        }
    }
    return (
        <div
            key={`${row.id}-${column}`}
            className={`col-${column}`}
            style={
                column === 'error_message'
                    ? {
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                      }
                    : {}
            }
        >
            {dom}
        </div>
    );
}

type TableColumn = keyof ITaskStatusRecord;

const runLogsColumns: TableColumn[] = [
    'id',
    'created_at',
    'updated_at',
    'status',
    'error_message',
];
const runLogsColumnsWidth: Partial<Record<TableColumn, number>> = {
    id: 1,
    created_at: 2,
    updated_at: 2,
    status: 1,
    error_message: 5,
};

const tableColumnAligns: Partial<Record<TableColumn, TableAlign>> = {
    id: 'center',
    created_at: 'center',
    updated_at: 'center',
    status: 'center',
};

export const DataDocScheduleRunLogs: React.FunctionComponent<{
    docId: number;
}> = ({ docId }) => {
    const { isLoading, isError, data } = useResource(
        React.useCallback(() => DataDocScheduleResource.getLogs(docId), [docId])
    );

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
            colNameToTextAlign={tableColumnAligns}
        />
    );
};
