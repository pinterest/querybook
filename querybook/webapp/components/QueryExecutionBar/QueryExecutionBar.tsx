import React from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment';

import { IStoreState } from 'redux/store/types';
import { IQueryExecution, QueryExecutionStatus } from 'const/queryExecution';
import { generateFormattedDate } from 'lib/utils/datetime';

import { CopyButton } from 'ui/CopyButton/CopyButton';
import { QueryExecutionNotificationButton } from './QueryExecutionNotificationButton';

import './QueryExecutionBar.scss';
import { StyledText } from 'ui/StyledText/StyledText';

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
        <StyledText className="mr12" color="light">
            {generateFormattedDate(queryExecution.created_at, 'X') +
                ', ' +
                moment.utc(queryExecution.created_at, 'X').fromNow()}
        </StyledText>
    );

    const notificationButtonDOM = queryExecution.status <=
        QueryExecutionStatus.RUNNING && (
        <QueryExecutionNotificationButton
            notificationPreference={notificationPreference}
            queryExecution={queryExecution}
        />
    );

    return (
        <div className="QueryExecutionBar">
            {executionDateDOM}
            {notificationButtonDOM}
            <CopyButton
                size="small"
                copyText={permalink}
                icon="Link"
                title="Share Execution"
                type="text"
            />
        </div>
    );
};
