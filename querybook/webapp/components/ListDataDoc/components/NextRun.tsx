import React from 'react';
import moment from 'moment';
import { getFutureMatches } from '@datasert/cronjs-matcher';

export const NextRun: React.FunctionComponent<{ cron?: string }> = ({
    cron,
}) => {
    if (!cron) {
        return <span />;
    }

    const data = getFutureMatches(cron);
    return <div>{moment(data[0]).utc().format('MMM D, H:mma')}</div>;
};
