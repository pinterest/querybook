import cronstrue from 'cronstrue';
import React, { useMemo } from 'react';

export const DescribeCron: React.FunctionComponent<{ cron?: string }> = ({
    cron,
}) => {
    const description = useMemo(() => {
        try {
            if (cron) {
                return cronstrue.toString(cron);
            }
        } catch (e) {
            return null;
        }
        return null;
    }, [cron]);

    return <>{description}</>;
};
