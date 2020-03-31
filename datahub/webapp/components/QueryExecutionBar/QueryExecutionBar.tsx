import React from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment';

import { IStoreState } from 'redux/store/types';
import { myUserInfoSelector } from 'redux/user/selector';
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
    const userInfo = useSelector(myUserInfoSelector);
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

    let notificationButtonDOM;
    if (queryExecution.status <= QueryExecutionStatus.RUNNING) {
        notificationButtonDOM = (
            <QueryExecutionNotificationButton
                notificationPreference={notificationPreference}
                queryExecution={queryExecution}
                userInfo={userInfo}
            />
        );
    }

    return (
        <>
            {executionDateDOM}
            {notificationButtonDOM}
            <CopyButton
                borderless
                small
                copyText={permalink}
                title="Share"
                type="inlineText"
            />
        </>
    );
};
