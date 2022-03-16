import React from 'react';
import { generateFormattedDate } from 'lib/utils/datetime';

export const LastRun: React.FunctionComponent<{ createdAt: number }> = ({
    createdAt,
}) => {
    if (!createdAt) {
        return null;
    }

    const lastRunDate = generateFormattedDate(createdAt);
    return <>{lastRunDate}</>;
};
