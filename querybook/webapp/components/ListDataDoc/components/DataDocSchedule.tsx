import React from 'react';
import cronstrue from 'cronstrue';

export const DataDocSchedule: React.FunctionComponent<{
    date: string;
}> = ({ date }) => {
    if (date) {
        return (
            <div
                title={cronstrue.toString(date, {
                    verbose: true,
                    use24HourTimeFormat: true,
                })}
            >
                {cronstrue.toString(date, {
                    verbose: true,
                    use24HourTimeFormat: true,
                })}
            </div>
        );
    }

    return <div />;
};
