import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { ErrorSuggestion } from 'components/DataDocStatementExecution/ErrorSuggestion';
import { IQueryEngine } from 'const/queryEngine';
import {
    IQueryError,
    IQueryExecution,
    IStatementExecution,
    QueryExecutionErrorType,
} from 'const/queryExecution';
import {
    getQueryLinePosition,
    IToken,
    tokenize,
} from 'lib/sql-helper/sql-lexer';
import { getAppName } from 'lib/utils/global';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';
import { fetchQueryError } from 'redux/queryExecutions/action';
import { IStoreState } from 'redux/store/types';
import { IHighlightRange } from 'ui/CodeHighlight/types';
import { Icon } from 'ui/Icon/Icon';
import { Loader } from 'ui/Loader/Loader';
import { Message } from 'ui/Message/Message';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';
import { Tabs } from 'ui/Tabs/Tabs';

import { ExecutedQueryCell } from './ExecutedQueryCell';

import './QueryError.scss';

interface IProps {
    queryEngine: IQueryEngine;
    queryError: IQueryError;
    queryExecution: IQueryExecution;
    statementExecutions: IStatementExecution[];
}

const queryErrorTypeToString: Record<number, string> = {
    [QueryExecutionErrorType.INTERNAL]: `Error from ${getAppName()} worker`,
    [QueryExecutionErrorType.ENGINE]: 'Error from Query Engine',
    [QueryExecutionErrorType.SYNTAX]: 'Syntax Error',
};

export const SyntaxQueryError: React.FunctionComponent<{
    errorTitle: string;
    errorMessage: string;
    queryExecution: IQueryExecution;
    statementExecutions: IStatementExecution[];
}> = ({ errorMessage, queryExecution, statementExecutions }) => {
    const parsedErrorMsg: {
        line?: number;
        char?: number;
        message: string;
    } = useMemo(() => JSON.parse(errorMessage), [errorMessage]);

    const query = queryExecution.query;
    const failedStatement = statementExecutions[statementExecutions.length - 1];

    const highlightedRange: IHighlightRange = React.useMemo(() => {
        if (parsedErrorMsg && query && failedStatement) {
            const statement = query.slice(
                failedStatement.statement_range_start,
                failedStatement.statement_range_end
            );
            const statementLineLength = getQueryLinePosition(statement);
            if (
                parsedErrorMsg.line != null &&
                parsedErrorMsg.line < statementLineLength.length - 1
            ) {
                // Try to find the token that has the error
                let errorToken: IToken;
                if (parsedErrorMsg.char != null) {
                    const tokens = tokenize(statement);
                    errorToken = tokens.find(
                        (token) =>
                            token.line === parsedErrorMsg.line &&
                            token.start <= parsedErrorMsg.char &&
                            token.end >= parsedErrorMsg.char
                    );
                }

                const range = errorToken
                    ? {
                          from:
                              statementLineLength[errorToken.line] +
                              errorToken.start,
                          to:
                              statementLineLength[errorToken.line] +
                              errorToken.end,
                      }
                    : {
                          from: statementLineLength[parsedErrorMsg.line],
                          to: statementLineLength[parsedErrorMsg.line + 1],
                      };

                return {
                    from: range.from + failedStatement.statement_range_start,
                    to: range.to + failedStatement.statement_range_start,
                    className: 'code-highlight-red',
                };
            }
        }
    }, [query, failedStatement, parsedErrorMsg]);

    return (
        <div>
            <ShowMoreText
                text={parsedErrorMsg && parsedErrorMsg.message}
                length={500}
            />
            {highlightedRange && (
                <ExecutedQueryCell
                    queryExecution={queryExecution}
                    highlightRange={highlightedRange}
                    maxEditorHeight={'200px'}
                />
            )}
        </div>
    );
};

export const QueryError: React.FunctionComponent<IProps> = ({
    queryError,
    queryExecution,
    statementExecutions,
    queryEngine,
}) => {
    const {
        error_message: errorMessage,
        error_message_extracted: errorMessageExtracted,
        error_type: errorType,
    } = queryError;
    const [showRaw, setShowRaw] = React.useState(false);
    const canShowShowRawTabs =
        errorMessage &&
        errorMessageExtracted &&
        errorMessage !== errorMessageExtracted;

    const showRawTabs = canShowShowRawTabs && (
        <Tabs
            items={['Extracted', 'Raw']}
            selectedTabKey={showRaw ? 'Raw' : 'Extracted'}
            onSelect={(key) => setShowRaw(key === 'Raw')}
            pills
            size="small"
        />
    );

    const errorMsg = canShowShowRawTabs
        ? !showRaw
            ? errorMessageExtracted
            : errorMessage
        : errorMessageExtracted || errorMessage;

    const errorTitle = queryErrorTypeToString[errorType] || 'Unknown Error';

    let errorContentDOM: React.ReactChild;
    if (
        errorType === QueryExecutionErrorType.SYNTAX &&
        statementExecutions.length
    ) {
        errorContentDOM = (
            <SyntaxQueryError
                errorTitle={errorTitle}
                errorMessage={errorMessage}
                queryExecution={queryExecution}
                statementExecutions={statementExecutions}
            />
        );
    } else {
        errorContentDOM = <ShowMoreText text={errorMsg} length={500} />;
    }

    return (
        <div className="QueryError mt4">
            <ErrorSuggestion
                queryError={queryError}
                queryExecution={queryExecution}
                statementExecutions={statementExecutions}
                queryEngine={queryEngine}
            />
            <Message
                type="error"
                size="small"
                title={
                    <span className="QueryError-title flex-row">
                        <Icon name="AlertOctagon" size={20} className="mr8" />
                        {errorTitle}
                    </span>
                }
            >
                <div className="QueryError-top">
                    <div className="QueryError-tabs">{showRawTabs}</div>
                </div>
                <div className="QueryError-content">{errorContentDOM}</div>
            </Message>
        </div>
    );
};

export const QueryErrorWrapper: React.FunctionComponent<{
    queryExecution: IQueryExecution;
    statementExecutions: IStatementExecution[];
}> = ({ queryExecution, statementExecutions }) => {
    const queryError = useSelector(
        (state: IStoreState) =>
            state.queryExecutions.queryErrorById[queryExecution.id]
    );
    const queryEngineById = useSelector(queryEngineByIdEnvSelector);
    const queryEngine = queryEngineById[queryExecution.engine_id];

    const dispatch = useDispatch();
    const loadQueryError = useCallback(
        (queryExecutionId: number) =>
            dispatch(fetchQueryError(queryExecutionId)),
        []
    );

    return (
        <Loader
            item={queryError}
            itemKey={queryExecution.id}
            itemLoader={loadQueryError.bind(null, queryExecution.id)}
            errorRenderer={() => 'Query Execution Failed with unknown error'}
        >
            <QueryError
                queryError={queryError}
                queryExecution={queryExecution}
                statementExecutions={statementExecutions}
                queryEngine={queryEngine}
            />
        </Loader>
    );
};
