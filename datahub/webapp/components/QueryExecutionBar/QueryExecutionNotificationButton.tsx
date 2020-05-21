import React, { useCallback, useState, useEffect } from 'react';

import ds from 'lib/datasource';
import { IQueryExecution } from 'redux/queryExecutions/types';
import { IUserInfo } from 'redux/user/types';

interface IProps {
    queryExecution: IQueryExecution;
    notificationPreference: string;
    userInfo: IUserInfo;
}

export const QueryExecutionNotificationButton: React.FunctionComponent<IProps> = ({
    queryExecution,
    notificationPreference,
    userInfo,
}) => {
    const [notification, setNotification] = useState<boolean>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const request = ds.fetch(
            `/query_execution_notification/${userInfo.id}/${queryExecution.id}/`
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
            ds.delete(
                `/query_execution_notification/${userInfo.id}/${queryExecution.id}/`
            ).then(() => {
                setLoading(false);
                setNotification(null);
            });
        } else {
            ds.save(
                `/query_execution_notification/${userInfo.id}/${queryExecution.id}/`
            ).then(({ data }) => {
                setLoading(false);
                setNotification(data);
            });
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
                aria-label={`${notificationPreference} me when finish`}
                data-balloon-pos={'up'}
                className="ml8"
            >
                Notify Me
            </span>
        </span>
    );
};
