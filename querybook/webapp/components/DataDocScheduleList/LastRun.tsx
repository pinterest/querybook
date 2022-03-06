import React from 'react';
import { generateFormattedDate } from 'lib/utils/datetime';

export const LastRun: React.FunctionComponent<{ createdAt: number }> = ({
    createdAt,
}) => {
    if (!createdAt) {
        return <div />;
    }

    const lastRunDate = generateFormattedDate(createdAt);
    return <div>{lastRunDate}</div>;
};
