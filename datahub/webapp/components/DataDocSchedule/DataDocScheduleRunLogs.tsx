import React from 'react';
import moment from 'moment';

import { IJobStatusRecord } from 'const/schedule';
import { generateFormattedDate } from 'lib/utils/datetime';
import { useDataFetch } from 'hooks/useDataFetch';
import { Loading } from 'ui/Loading/Loading';
import { ErrorMessage } from 'ui/Message/ErrorMessage';
import { Table } from 'ui/Table/Table';
import { JobStatusIcon } from 'components/JobStatus/JobStatusIcon';

function formatCell(index: number, column: string, row: IJobStatusRecord) {
    const value = row[column];
    let dom = value;
    switch (column) {
        case 'created_at': {
            dom = `${generateFormattedDate(value, 'X')}, ${moment
                .utc(value, 'X')
                .fromNow()}`;
            break;
        }
        case 'name': {
            dom = <b>{value}</b>;
            break;
        }
        case 'status': {
            dom = <JobStatusIcon type={value} />;
            break;
        }
    }
    return (
        <div key={`${row.id}-${column}`} className={`col-${column}`}>
            {dom}
        </div>
    );
}

export const DataDocScheduleRunLogs: React.FunctionComponent<{
    docId: number;
}> = ({ docId }) => {
    const { isLoading, isError, data } = useDataFetch({
        url: `/datadoc/${docId}/run/`,
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
            cols={['id', 'created_at', 'name', 'status']}
            formatCell={formatCell}
            showAllRows={true}
        />
    );
};
