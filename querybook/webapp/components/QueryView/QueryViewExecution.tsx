import React from 'react';

import { QueryExecution } from 'components/QueryExecution/QueryExecution';
import { QueryExecutionDuration } from 'components/QueryExecution/QueryExecutionDuration';
import { QueryExecutionBar } from 'components/QueryExecutionBar/QueryExecutionBar';
import { IQueryExecution } from 'const/queryExecution';

export const QueryViewExecution: React.FunctionComponent<{
    queryExecution: IQueryExecution;
}> = ({ queryExecution }) => {
    const queryExecutionDOM = queryExecution && (
        <div className="query-execution-section-inner">
            <div className="horizontal-space-between">
                <QueryExecutionDuration queryExecution={queryExecution} />
                <QueryExecutionBar queryExecution={queryExecution} />
            </div>
            <QueryExecution id={queryExecution.id} key={queryExecution.id} />
        </div>
    );

    const queryExecutionSectionDOM = (
        <div className="query-execution-section">
            {/* <Resizable
                defaultSize={{
                    width: '100%',
                    height: '300px',
                }}
                enable={enableResizable({ top: true })}
            > */}
            {queryExecutionDOM}
            {/* </Resizable> */}
        </div>
    );

    return queryExecutionSectionDOM;
};
