import React, { useCallback, useState, useEffect } from 'react';

import {
    IQueryExecution,
    IQueryExecutionNotification,
} from 'const/queryExecution';
import { QueryExecutionNotificationResource } from 'resource/queryExecution';

interface IProps {
    queryExecution: IQueryExecution;
    notificationPreference: string;
}

export const QueryExecutionNotificationButton: React.FunctionComponent<IProps> = ({
    queryExecution,
    notificationPreference,
}) => {
    const [
        notification,
        setNotification,
    ] = useState<IQueryExecutionNotification>(null);
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

    const iconClass = loading
        ? 'fa fa-spinner fa-pulse'
        : notification
        ? 'far fa-check-circle'
        : 'far fa-circle';

    return (
        <span
            className="copy-permalink-button"
            onClick={loading ? null : handleNotificationToggle}
        >
            <i className={iconClass} />
            <span
                aria-label={`Notify me with ${notificationPreference} when finished`}
                data-balloon-pos={'up'}
                className="ml8"
            >
                Notify Me
            </span>
        </span>
    );
};
