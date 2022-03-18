import React from 'react';
import moment from 'moment';

import { IScheduledDoc } from 'redux/scheduledDataDoc/types';
import { DataDocName } from './DataDocName';
import { HumanReadableCronSchedule } from './HumanReadableCronSchedule';

import {
    DataDocScheduleActionEdit,
    DataDocScheduleActionHistory,
} from './DataDocScheduleActionButtons';
import { NextRun } from './NextRun';
import { TaskStatusIcon } from 'components/Task/TaskStatusIcon';
import { formatDuration, generateFormattedDate } from 'lib/utils/datetime';

import './DataDocScheduleItem.scss';

interface IDataDocScheduleItemProps {
    docWithSchedule: IScheduledDoc;
}

export const DataDocScheduleItem: React.FC<IDataDocScheduleItemProps> = ({
    docWithSchedule,
}) => {
    const renderScheduleInfo = () => {
        const { schedule } = docWithSchedule;

        if (!schedule) {
            return null;
        }

        return (
            <div className="DataDocScheduleItem-bottom mt4 horizontal-space-between">
                <div>
                    <div className="schedule-text">
                        Runs <HumanReadableCronSchedule cron={schedule.cron} />
                    </div>
                    <div className="next-text mt4">
                        Next Run: <NextRun cron={schedule.cron} />
                    </div>
                </div>
                {lastRecord && (
                    <DataDocScheduleActionHistory
                        docId={doc.id}
                        actionText="View Run Record"
                        docTitle={doc.title}
                    />
                )}
            </div>
        );
    };

    const getRunTime = React.useCallback(
        (startTime: number, endTime: number) => {
            const timeDiff = Math.ceil(endTime - startTime);

            if (timeDiff === 0) {
                return 'less than 1s';
            }

            return formatDuration(moment.duration(timeDiff, 'seconds'));
        },
        []
    );

    const renderLastRunRecordInfo = () => {
        if (!docWithSchedule.schedule) {
            return null;
        }

        const { last_record: lastRecord } = docWithSchedule;

        if (!lastRecord) {
            return null;
        }

        const tooltipText = `Run on ${generateFormattedDate(
            lastRecord.created_at
        )} for ${getRunTime(lastRecord.created_at, lastRecord.updated_at)}`;

        return (
            <div
                className="ml12"
                aria-label={tooltipText}
                data-balloon-pos="right"
            >
                <TaskStatusIcon type={lastRecord.status} />
            </div>
        );
    };

    const { doc, schedule, last_record: lastRecord } = docWithSchedule;

    return (
        <div className="DataDocScheduleItem mb12">
            <div className="horizontal-space-between">
                <div className="flex-row">
                    <DataDocName data={docWithSchedule.doc} />
                    {renderLastRunRecordInfo()}
                </div>
                <div>
                    <DataDocScheduleActionEdit
                        docId={doc.id}
                        actionText={schedule ? 'Edit Schedule' : 'New Schedule'}
                    />
                </div>
            </div>
            {renderScheduleInfo()}
        </div>
    );
};
