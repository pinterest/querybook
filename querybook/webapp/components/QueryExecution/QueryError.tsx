import React, { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { QueryExecutionErrorType } from 'const/queryExecution';
import {
    IQueryError,
    IQueryExecution,
    IStatementExecution,
} from 'redux/queryExecutions/types';
import {
    tokenize,
    getQueryLinePosition,
    IToken,
} from 'lib/sql-helper/sql-lexer';

import { IQueryEngine } from 'const/queryEngine';
import { getAppName } from 'lib/utils/global';
import { fetchQueryError } from 'redux/queryExecutions/action';
import { IStoreState } from 'redux/store/types';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';

import { ErrorSuggestion } from 'components/DataDocStatementExecution/ErrorSuggestion';
import { Icon } from 'ui/Icon/Icon';
import { Message } from 'ui/Message/Message';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';
import { Tabs } from 'ui/Tabs/Tabs';
import { Loader } from 'ui/Loader/Loader';

import { ExecutedQueryCell, IHighlightRange } from './ExecutedQueryCell';
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
                    editorHeight={'200px'}
                />
            )}
        </div>
    );
};

export const QueryError: React.FunctionComponent<IProps> = ({
    queryError: {
        error_message: errorMessage,
        error_message_extracted: errorMessageExtracted,
        error_type: errorType,
    },
    queryExecution,
    statementExecutions,
    queryEngine,
}) => {
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
        <div className="QueryError">
            <ErrorSuggestion
                errorMsg={errorMsg}
                language={queryEngine.language}
            />
            <Message type="error" size="small">
                <div className="QueryError-top">
                    <div className="QueryError-title flex-row">
                        <Icon name="alert-circle" size={20} />
                        {errorTitle}
                    </div>
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
