import { getFutureMatches } from '@datasert/cronjs-matcher';
import moment from 'moment';
import React, { useMemo } from 'react';

import { generateFormattedDate } from 'lib/utils/datetime';

export const NextRun: React.FunctionComponent<{ cron?: string }> = ({
    cron,
}) => {
    const formattedDate = useMemo(() => {
        if (!cron) {
            return null;
        }
        const [nextDate] = getFutureMatches(cron);
        return generateFormattedDate(moment(nextDate).unix());
    }, [cron]);

    return <>{formattedDate}</>;
};
