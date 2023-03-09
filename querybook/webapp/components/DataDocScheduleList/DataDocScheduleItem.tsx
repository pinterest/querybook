import moment from 'moment';
import React from 'react';

import { TaskStatusIcon } from 'components/Task/TaskStatusIcon';
import { formatDuration, generateFormattedDate } from 'lib/utils/datetime';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { cronToRecurrence } from 'lib/utils/cron';
import { IScheduledDoc } from 'redux/scheduledDataDoc/types';
import { Link } from 'ui/Link/Link';
import { AccentText, StyledText, UntitledText } from 'ui/StyledText/StyledText';

import {
    DataDocScheduleActionEdit,
    DataDocScheduleActionHistory,
} from './DataDocScheduleActionButtons';
import { HumanReadableCronSchedule } from './HumanReadableCronSchedule';
import { NextRun } from 'components/NextRun/NextRun';

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
            <div className="DataDocScheduleItem-bottom  horizontal-space-between">
                <div>
                    <StyledText size="text">
                        Runs <HumanReadableCronSchedule cron={schedule.cron} />{' '}
                        {cronToRecurrence(schedule.cron).recurrence == 'hourly'
                            ? ''
                            : ' (UTC time)'}
                    </StyledText>
                    <StyledText color="light" className="mt4">
                        Next Run:{' '}
                        {schedule.enabled ? (
                            <NextRun cron={schedule.cron} />
                        ) : (
                            'Disabled'
                        )}{' '}
                        (Local time)
                    </StyledText>
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
    const isScheduleDisabled = schedule?.enabled === false;

    return (
        <div className="DataDocScheduleItem mb12">
            <div className="horizontal-space-between">
                <div className="flex-row">
                    <Link to={getWithinEnvUrl(`/datadoc/${doc.id}/`)}>
                        {doc.title ? (
                            <AccentText
                                weight="bold"
                                size="med"
                                color={isScheduleDisabled ? 'lightest' : 'text'}
                            >
                                {doc.title}
                            </AccentText>
                        ) : (
                            <UntitledText size="med" />
                        )}
                    </Link>
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
