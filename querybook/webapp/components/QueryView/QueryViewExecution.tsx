import React from 'react';

import { QueryExecution } from 'components/QueryExecution/QueryExecution';
import { QueryExecutionDuration } from 'components/QueryExecution/QueryExecutionDuration';
import { QueryExecutionBar } from 'components/QueryExecutionBar/QueryExecutionBar';
import { IQueryExecution } from 'const/queryExecution';
import { useQueryReview } from 'hooks/useQueryReview';
import { useToggleState } from 'hooks/useToggleState';
import { QueryViewReview } from 'components/QueryViewReview/QueryViewReview';

interface IQueryViewExecutionProps {
    queryExecution: IQueryExecution;
}

export const QueryViewExecution: React.FunctionComponent<
    IQueryViewExecutionProps
> = ({ queryExecution }) => {
    const queryReviewState = useQueryReview(queryExecution.id);
    const [showReviewPanel, setShowReviewPanel, toggleReviewPanel] =
        useToggleState(
            // Auto-expand if review exists and is pending or rejected
            queryReviewState.status.isPending ||
                queryReviewState.status.isRejected
        );
    const queryReview = queryReviewState.review;

    const queryExecutionDOM = queryExecution && (
        <div className="query-execution-section-inner">
            <div className="horizontal-space-between">
                <QueryExecutionDuration queryExecution={queryExecution} />
                <QueryExecutionBar
                    queryExecution={queryExecution}
                    queryReview={queryReview}
                    onReviewClick={toggleReviewPanel}
                />
            </div>
            {queryReview && showReviewPanel && (
                <QueryViewReview
                    queryExecution={queryExecution}
                    queryReviewState={queryReviewState}
                    isExpanded={showReviewPanel}
                />
            )}
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
