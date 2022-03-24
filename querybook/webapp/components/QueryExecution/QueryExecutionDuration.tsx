import moment from 'moment';
import * as React from 'react';

import { IQueryExecution, QueryExecutionStatus } from 'const/queryExecution';
import { generateFormattedDate, formatDuration } from 'lib/utils/datetime';

import { UserName } from 'components/UserBadge/UserName';
import { useQueryExecutionReduxState } from './QueryExecution';
import { StyledText } from 'ui/StyledText/StyledText';

interface IProps {
    queryExecution: IQueryExecution;
}

export const QueryExecutionDuration: React.FunctionComponent<IProps> = ({
    queryExecution,
}) => {
    const { statementExecutions } = useQueryExecutionReduxState(
        queryExecution.id
    );

    let durationText = '';
    if (queryExecution.status < QueryExecutionStatus.DONE) {
        durationText = `running since ${generateFormattedDate(
            queryExecution.created_at
        )}`;
    } else {
        const lastExecution =
            statementExecutions[statementExecutions.length - 1];
        durationText = 'run ';

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
    }

    return (
        <StyledText className="ml8" color="light">
            {durationText} by <UserName uid={queryExecution.uid} />
        </StyledText>
    );
};
