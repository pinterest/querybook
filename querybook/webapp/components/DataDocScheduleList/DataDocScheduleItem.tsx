import React from 'react';
import { IScheduledDoc } from 'redux/scheduledDataDoc/types';
import { DataDocName } from './DataDocName';
import { HumanReadableCronSchedule } from './HumanReadableCronSchedule';

import './DataDocScheduleItem.scss';
import {
    DataDocScheduleActionEdit,
    DataDocScheduleActionHistory,
} from './DataDocScheduleActionButtons';
import { NextRun } from './NextRun';
import { LastRun } from './LastRun';
import { LastRecordRunTime } from './LastRecordRunTime';
import { TaskStatusIcon } from 'components/Task/TaskStatusIcon';

interface IDataDocScheduleItemProps {
    docWithSchedule: IScheduledDoc;
}

export const DataDocScheduleItem: React.FC<IDataDocScheduleItemProps> = ({
    docWithSchedule,
}) => {
    const renderScheduleInfo = () => {
        const { doc, schedule } = docWithSchedule;
        if (!schedule) {
            return null;
        }

        const nextRunDOM = (
            <div>
                Next time to run: <NextRun cron={schedule.cron} />.
            </div>
        );

        return (
            <div className="flex-row">
                <span className="mr8">
                    Scheduled to run:{' '}
                    <HumanReadableCronSchedule cron={schedule.cron} />
                </span>
                {nextRunDOM}
            </div>
        );
    };

    const renderLastRunRecordInfo = () => {
        if (!docWithSchedule.schedule) {
            return null;
        }

        const { last_record: lastRecord } = docWithSchedule;

        if (!lastRecord) {
            return (
                <div>
                    <div>No run records found.</div>
                </div>
            );
        }

        const lastRunHistoryDOM = (
            <div className="horizontal-space-between">
                <div className="flex-row">
                    Last ran on <LastRun createdAt={lastRecord.created_at} />{' '}
                    for <LastRecordRunTime recordDates={lastRecord} />. The
                    status of the last run was{' '}
                    <TaskStatusIcon type={lastRecord.status} />.
                </div>
            </div>
        );

        return <div>{lastRunHistoryDOM}</div>;
    };

    const { doc, schedule, last_record: lastRecord } = docWithSchedule;

    return (
        <div className="DataDocScheduleItem mb12">
            <div className="horizontal-space-between">
                <DataDocName data={docWithSchedule.doc} />
                <div>
                    {lastRecord && (
                        <DataDocScheduleActionHistory
                            docId={doc.id}
                            actionText="View all records"
                        />
                    )}
                    <DataDocScheduleActionEdit
                        docId={doc.id}
                        actionText={schedule ? 'Edit Schedule' : 'New Schedule'}
                    />
                </div>
            </div>
            {renderScheduleInfo()}
            {renderLastRunRecordInfo()}
        </div>
    );
};
