import React from 'react';
import moment from 'moment';
import { getFutureMatches } from '@datasert/cronjs-matcher';
import { generateFormattedDate } from 'lib/utils/datetime';

export const NextRun: React.FunctionComponent<{ cron?: string }> = ({
    cron,
}) => {
    if (!cron) {
        return <span />;
    }

    const [nextDate] = getFutureMatches(cron);
    return <div>{generateFormattedDate(moment(nextDate).unix())}</div>;
};
