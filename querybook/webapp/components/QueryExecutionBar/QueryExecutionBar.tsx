import React from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment';

import { IStoreState } from 'redux/store/types';
import { IQueryExecution } from 'redux/queryExecutions/types';
import { generateFormattedDate } from 'lib/utils/datetime';

import { CopyButton } from 'ui/CopyButton/CopyButton';
import { QueryExecutionNotificationButton } from './QueryExecutionNotificationButton';
import { QueryExecutionStatus } from 'const/queryExecution';

import './QueryExecutionBar.scss';

interface IProps {
    queryExecution: IQueryExecution;
    permalink: string;
}

export const QueryExecutionBar: React.FunctionComponent<IProps> = ({
    queryExecution,
    permalink,
}) => {
    const notificationPreference = useSelector(
        (state: IStoreState) =>
            state.user.computedSettings.notification_preference
    );

    const executionDateDOM = (
        <span>
            {generateFormattedDate(queryExecution.created_at, 'X') +
                ', ' +
                moment.utc(queryExecution.created_at, 'X').fromNow()}
        </span>
    );

    const notificationButtonDOM = queryExecution.status <=
        QueryExecutionStatus.RUNNING && (
        <QueryExecutionNotificationButton
            notificationPreference={notificationPreference}
            queryExecution={queryExecution}
        />
    );

    return (
        <>
            {executionDateDOM}
            {notificationButtonDOM}
            <CopyButton
                type="text"
                size="small"
                copyText={permalink}
                icon="link"
                title="Share Execution"
            />
        </>
    );
};
