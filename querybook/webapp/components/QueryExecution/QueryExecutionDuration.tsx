import moment from 'moment';
import * as React from 'react';

import { IQueryExecution, QueryExecutionStatus } from 'const/queryExecution';
import { formatDuration } from 'lib/utils/datetime';

import { UserName } from 'components/UserBadge/UserName';
import { useQueryExecutionReduxState } from './QueryExecution';
import { StyledText } from 'ui/StyledText/StyledText';
import { TaskStatusIcon } from 'components/Task/TaskStatusIcon';
import { TaskRunStatus } from 'const/schedule';

interface IProps {
    queryExecution: IQueryExecution;
}

export const QueryExecutionDuration: React.FunctionComponent<IProps> = ({
    queryExecution,
}) => {
    const { statementExecutions } = useQueryExecutionReduxState(
        queryExecution.id
    );

    let durationDOM = null;
    if (queryExecution.status < QueryExecutionStatus.DONE) {
        durationDOM = <TaskStatusIcon type={TaskRunStatus.RUNNING} />;
    } else {
        const lastExecution =
            statementExecutions[statementExecutions.length - 1];
        let durationText = 'Run ';

        if (lastExecution && lastExecution.completed_at) {
            durationText =
                durationText +
                `for ${formatDuration(
                    moment.duration(
                        lastExecution.completed_at - queryExecution.created_at,
                        'seconds'
                    )
                )}`;
        }
        durationDOM = durationText;
    }

    return (
        <StyledText className="flex-row" color="light">
            {durationDOM}
            <span className="mh4">by</span>
            <UserName uid={queryExecution.uid} />
        </StyledText>
    );
};
