import React from 'react';
import cronstrue from 'cronstrue';

export const DataDocSchedule: React.FunctionComponent<{
    cron: string;
}> = ({ cron }) => {
    if (cron) {
        const friedlyCronSchedule = cronstrue.toString(cron, {
            verbose: true,
            use24HourTimeFormat: true,
        });

        return <div title={friedlyCronSchedule}>{friedlyCronSchedule}</div>;
    }

    return <div />;
};
