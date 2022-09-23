import React, { useMemo } from 'react';

import { IQueryEngine } from 'const/queryEngine';
import {
    IQueryError,
    IQueryExecution,
    IStatementExecution,
} from 'const/queryExecution';
import { getQueryErrorSuggestion } from 'lib/query-result/error-suggestion';
import { Markdown } from 'ui/Markdown/Markdown';
import { Message } from 'ui/Message/Message';

interface IProps {
    queryError: IQueryError;
    queryExecution: IQueryExecution;
    statementExecutions: IStatementExecution[];
    queryEngine: IQueryEngine;
}

export const ErrorSuggestion: React.FunctionComponent<IProps> = ({
    queryError,
    queryExecution,
    statementExecutions,
    queryEngine,
}) => {
    const suggestion = useMemo(
        () =>
            getQueryErrorSuggestion(
                queryError,
                queryExecution,
                statementExecutions,
                queryEngine
            ),
        [queryError, queryExecution, statementExecutions, queryEngine]
    );

    return suggestion ? (
        <Message
            className="ErrorSuggestion"
            icon="Zap"
            iconSize={20}
            type="tip"
        >
            <Markdown>{suggestion}</Markdown>
        </Message>
    ) : null;
};
