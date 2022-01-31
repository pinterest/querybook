import React from 'react';

export const LastRecord: React.FunctionComponent<{
    value: { created_at: number; updated_at: number };
}> = ({ value }) => {
    if (!value) {
        return <div />;
    }

    const time = Math.ceil(value?.updated_at - value?.created_at);

    const date = new Date(null);
    date.setSeconds(time);
    const hhmmsstime = date.toISOString().substr(11, 8);
    return <div>{hhmmsstime}</div>;
};
