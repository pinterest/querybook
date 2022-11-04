import React, { useCallback, useEffect, useState } from 'react';

import {
    IQueryExecution,
    IQueryExecutionNotification,
} from 'const/queryExecution';
import { QueryExecutionNotificationResource } from 'resource/queryExecution';
import { Icon } from 'ui/Icon/Icon';

interface IProps {
    queryExecution: IQueryExecution;
    notificationPreference: string;
}

export const QueryExecutionNotificationButton: React.FunctionComponent<
    IProps
> = ({ queryExecution, notificationPreference }) => {
    const [notification, setNotification] =
        useState<IQueryExecutionNotification>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const request = QueryExecutionNotificationResource.get(
            queryExecution.id
        );

        request.then(({ data }) => {
            setLoading(false);
            setNotification(data);
        });

        return () => {
            if (request) {
                request.cancel();
            }
        };
    }, []);

    const handleNotificationToggle = useCallback(() => {
        setLoading(true);

        if (notification) {
            QueryExecutionNotificationResource.delete(queryExecution.id).then(
                () => {
                    setLoading(false);
                    setNotification(null);
                }
            );
        } else {
            QueryExecutionNotificationResource.create(queryExecution.id).then(
                ({ data }) => {
                    setLoading(false);
                    setNotification(data);
                }
            );
        }
    }, [notification]);

    const iconName = loading
        ? 'Loading'
        : notification
        ? 'CheckCircle'
        : 'Circle';

    return (
        <span
            className="copy-permalink-button flex-row"
            onClick={loading ? null : handleNotificationToggle}
        >
            <Icon name={iconName} size={16} />
            <span
                aria-label={`Notify me with ${notificationPreference} when finished`}
                data-balloon-pos={'up'}
                className="ml4"
            >
                Notify Me
            </span>
        </span>
    );
};
