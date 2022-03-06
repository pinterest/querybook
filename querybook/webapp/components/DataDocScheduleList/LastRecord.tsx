import React, { useMemo } from 'react';
import moment from 'moment';
import { formatDuration } from 'lib/utils/datetime';

export const LastRecord: React.FunctionComponent<{
    recordDates: { created_at: number; updated_at: number };
}> = ({ recordDates }) => {
    const hoursAndMinutesTime = useMemo(() => {
        if (!recordDates) {
            return '';
        }

        const timeDiff = Math.ceil(
            recordDates.updated_at - recordDates.created_at
        );

        if (timeDiff === 0) {
            return 'less than 1s';
        }

        return formatDuration(moment.duration(timeDiff, 'seconds'));
    }, [recordDates]);

    return <div>{hoursAndMinutesTime}</div>;
};
