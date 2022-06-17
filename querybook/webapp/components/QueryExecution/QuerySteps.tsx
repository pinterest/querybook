import React from 'react';

import { IQueryExecution, QueryExecutionStatus } from 'const/queryExecution';
import { StepsBar } from 'ui/StepsBar/StepsBar';

export const QuerySteps: React.FunctionComponent<{
    queryExecution: IQueryExecution;
}> = ({
    queryExecution: {
        status,
        task_id: taskId,
        statement_executions: statementExecutionIds,
        total,
    },
}) => {
    if (status >= 3) {
        // Finished state
        return null;
    }

    let currentStep = 0;
    const steps = [
        'Send to worker',
        'Connect to engine',
        'Running Query',
        'Finish',
    ];

    if (taskId != null) {
        // Celery have received the query
        currentStep++;

        if (
            status === QueryExecutionStatus.RUNNING &&
            statementExecutionIds != null
        ) {
            // We have connected to engine
            currentStep++;
            if (total != null) {
                steps[2] = `${steps[2]} ${statementExecutionIds.length}/${total}`;
            }
        }
    }

    return <StepsBar steps={steps} activeStep={currentStep} />;
};
