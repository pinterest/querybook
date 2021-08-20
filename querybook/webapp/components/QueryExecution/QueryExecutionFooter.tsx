import React from 'react';
import moment from 'moment';

import {
    QueryExecutionStatus,
    IQueryExecution,
    IStatementExecution,
} from 'const/queryExecution';
import { UserName } from 'components/UserBadge/UserName';
import { generateFormattedDate, formatDuration } from 'lib/utils/datetime';

export const QueryExecutionFooter: React.FunctionComponent<{
    queryExecution: IQueryExecution;
    statementExecutions: IStatementExecution[];
}> = ({
    queryExecution: { status, created_at: createdAt, uid },
    statementExecutions,
}) => {
    let text = '';
    if (status < QueryExecutionStatus.DONE) {
        text = `Running since ${generateFormattedDate(createdAt)}`;
    } else {
        const lastExecution =
            statementExecutions[statementExecutions.length - 1];
        text = 'Run ';

        if (lastExecution && lastExecution.completed_at) {
            text =
                text +
                `on ${generateFormattedDate(createdAt)} for ${formatDuration(
                    moment.duration(
                        lastExecution.completed_at - createdAt,
                        'seconds'
                    )
                )}`;
        }
    }

    return (
        <span className="run-time-message">
            {text} by <UserName uid={uid} />.
        </span>
    );
};
