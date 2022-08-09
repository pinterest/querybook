import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { IQueryExecution, QueryExecutionStatus } from 'const/queryExecution';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { IStoreState } from 'redux/store/types';
import { CopyButton } from 'ui/CopyButton/CopyButton';
import { StyledText } from 'ui/StyledText/StyledText';
import { TimeFromNow } from 'ui/Timer/TimeFromNow';

import { QueryExecutionNotificationButton } from './QueryExecutionNotificationButton';

import './QueryExecutionBar.scss';

interface IProps {
    queryExecution: IQueryExecution;
}

function useQueryExecutionUrl(queryExecution: IQueryExecution) {
    return useMemo(
        () =>
            `${location.protocol}//${location.host}${getWithinEnvUrl(
                `/query_execution/${queryExecution.id}/`
            )}`,
        [queryExecution.id]
    );
}

export const QueryExecutionBar: React.FunctionComponent<IProps> = ({
    queryExecution,
}) => {
    const permalink = useQueryExecutionUrl(queryExecution);
    const notificationPreference = useSelector(
        (state: IStoreState) =>
            state.user.computedSettings.notification_preference
    );

    const executionDateDOM = (
        <StyledText className="mr8" color="light">
            <TimeFromNow
                timestamp={queryExecution.created_at}
                withFormattedDate
            />
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
