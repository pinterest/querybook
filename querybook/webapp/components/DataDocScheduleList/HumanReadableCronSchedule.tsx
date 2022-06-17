import React from 'react';

import { cronToRecurrence } from 'lib/utils/cron';

import { cronFormatter } from './cronHelper';

function humanReadableCron(cron: string): string {
    const parsedCronExecution = cronToRecurrence(cron);
    return cronFormatter(parsedCronExecution);
}

export const HumanReadableCronSchedule: React.FunctionComponent<{
    cron: string;
}> = ({ cron }) => {
    if (!cron) {
        return null;
    }

    return <>{humanReadableCron(cron)}</>;
};
