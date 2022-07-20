import moment from 'moment';
import React, { useEffect, useMemo, useState } from 'react';

import { generateFormattedDate } from 'lib/utils/datetime';

export interface TimeFromNowProps {
    /**
     * Assumed this UTC timestamp in number of seconds
     */
    timestamp: number;
    withFormattedDate?: boolean;
}

// Reference https://momentjscom.readthedocs.io/en/latest/moment/04-displaying/02-fromnow/
const FromNowTimeSegments: Array<{
    /**
     * the number of seconds where this applies
     * the array should be sorted by upper bound
     */
    upperbound: number;
    /**
     * number of seconds wait for the next update
     */
    timeToUpdate: number;
}> = [
    {
        // A few seconds
        upperbound: 44,
        timeToUpdate: 45, // 44s + 1s
    },
    {
        // A minute ago
        upperbound: 90,
        timeToUpdate: 47, // 90s - 44 + 1s
    },
    {
        // n minutes ago, up to 44 minutes
        upperbound: 2700, // 45 * 60
        timeToUpdate: 60,
    },
    {
        // an hour ago
        upperbound: 5400, // 90 * 60,
        timeToUpdate: 2701, // 5400 - 2700 + 1
    },
    {
        // n hour ago, up to 21
        upperbound: 75600, // 21 * 60 * 60
        timeToUpdate: 3600, // 60 * 60
    },
    // After this point, the update only happens once per day
];

export const TimeFromNow: React.FC<TimeFromNowProps> = ({
    timestamp,
    withFormattedDate = false,
}) => {
    const [forceRefresh, setForceRefresh] = useState(0);
    const nextTimeToUpdate = useMemo(() => {
        const nowSeconds = new Date().getTime() / 1000;
        const secondsFromNow = Math.round(nowSeconds - timestamp);

        return FromNowTimeSegments.find(
            (entry) => secondsFromNow < entry.upperbound
        )?.timeToUpdate;

        // forceRefresh is used to rerender nextTimeToUpdate
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timestamp, forceRefresh]);

    useEffect(() => {
        let timeout: number;

        if (nextTimeToUpdate != null) {
            timeout = setTimeout(() => {
                setForceRefresh((v) => v + 1);
            }, nextTimeToUpdate * 1000);
        }

        return () => {
            if (timeout != null) {
                clearTimeout(timeout);
            }
        };
    }, [nextTimeToUpdate, forceRefresh]);

    return (
        <>
            {withFormattedDate
                ? generateFormattedDate(timestamp, 'X') + ', '
                : ''}
            {moment.utc(timestamp, 'X').fromNow()}
        </>
    );
};
