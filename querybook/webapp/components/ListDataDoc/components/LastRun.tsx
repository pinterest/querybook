import React from 'react';
import moment from 'moment';

export const LastRun: React.FunctionComponent<{ createdAt: number }> = ({
    createdAt,
}) => {
    return createdAt ? (
        <div
            title={`${moment
                .unix(createdAt)
                .utc()
                .format('MMM D, H:mma')}, ${moment
                .unix(createdAt)
                .utc()
                .fromNow()}`}
        >
            {moment.unix(createdAt).utc().format('MMM D, H:mma')}
        </div>
    ) : (
        <div />
    );
};
