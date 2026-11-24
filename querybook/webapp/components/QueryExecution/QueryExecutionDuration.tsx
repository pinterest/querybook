import moment from 'moment';
import * as React from 'react';

import { TaskStatusIcon } from 'components/Task/TaskStatusIcon';
import { TaskCancelBtn } from 'components/Task/TaskCancelBtn';
import { UserName } from 'components/UserBadge/UserName';
import { IQueryExecution, QueryExecutionStatus } from 'const/queryExecution';
import { TaskRunStatus } from 'const/schedule';
import { formatDuration } from 'lib/utils/datetime';
import { StyledText } from 'ui/StyledText/StyledText';

interface IProps {
    queryExecution: IQueryExecution;
}

export const QueryExecutionDuration: React.FunctionComponent<IProps> = ({
    queryExecution,
}) => {
    let durationDOM = null;
    let cancelDOM = null;
    if (queryExecution.status < QueryExecutionStatus.DONE) {
        durationDOM = <TaskStatusIcon type={TaskRunStatus.RUNNING} />;
        cancelDOM = <TaskCancelBtn queryExecutionId={queryExecution.id} />;
    } else {
        let durationText = 'Run ';

        if (queryExecution.completed_at) {
            durationText =
                durationText +
                `for ${formatDuration(
                    moment.duration(
                        queryExecution.completed_at - queryExecution.created_at,
                        'seconds'
                    )
                )}`;
        }
        durationDOM = durationText;
    }

    return (
        <StyledText className="flex-row mr8" color="light">
            {durationDOM}
            <span className="mh4">by</span>
            <UserName uid={queryExecution.uid} />
            {cancelDOM}
        </StyledText>
    );
};
