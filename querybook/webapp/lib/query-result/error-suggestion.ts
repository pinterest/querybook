import queryErrorsByLanguage from 'config/query_error.yaml';
import { IQueryEngine } from 'const/queryEngine';
import {
    IQueryError,
    IQueryExecution,
    IStatementExecution,
} from 'const/queryExecution';

const SHARED_ERROR_SUGGESTION = 'common';

// Merge all the common in
for (const language of Object.keys(queryErrorsByLanguage)) {
    if (language !== SHARED_ERROR_SUGGESTION) {
        queryErrorsByLanguage[language] = {
            ...queryErrorsByLanguage[language],
            ...queryErrorsByLanguage[SHARED_ERROR_SUGGESTION],
        };
    }
}

const errorSuggestionInfoByLanguage = Object.entries(
    queryErrorsByLanguage
).reduce(
    (hash, [language, queryErrors]) => {
        if (language !== SHARED_ERROR_SUGGESTION) {
            hash[language] = Object.entries(queryErrors).reduce(
                (innerHash, [errorName, error]) => {
                    innerHash[errorName] = {
                        ...error,
                        regex: new RegExp(error.regex, 'i'),
                    };
                    return innerHash;
                },
                {}
            );
        }
        return hash;
    },
    {} as {
        [language: string]: {
            [errorName: string]: {
                regex: RegExp;
                message: string;
            };
        };
    }
);

function getDefaultQueryErrorSuggestion(
    queryError: IQueryError,
    _queryExecution: IQueryExecution,
    _statementExecutions: IStatementExecution[],
    queryEngine: IQueryEngine
): string {
    const errorMsg = queryError.error_message;
    const language = queryEngine.language;

    for (const errorInfo of Object.values(
        errorSuggestionInfoByLanguage[language] ?? {}
    )) {
        if (errorInfo.regex.test(errorMsg)) {
            return errorInfo.message;
        }
    }
    return '';
}

export function getQueryErrorSuggestion(
    queryError: IQueryError,
    queryExecution: IQueryExecution,
    statementExecutions: IStatementExecution[],
    queryEngine: IQueryEngine
): string {
    const getSuggestions =
        window.GET_QUERY_ERROR_SUGGESTION ?? getDefaultQueryErrorSuggestion;
    return getSuggestions(
        queryError,
        queryExecution,
        statementExecutions,
        queryEngine
    );
}
