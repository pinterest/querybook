import {
    getStatementsFromQuery,
    getStatementType,
    IToken,
    simpleParse,
    tokenize,
    tokenPatternMatch,
} from './sql-lexer';

import { Nullable } from 'lib/typescript';

/**
 *
/**
 * Checks if a select statement has a limit and returns the limit
 * If the statement is not select then null is returned
 * If the statement has no limit then -1 is returned
 *
 * @param statement the query string
 * @param language language of the query
 * @returns the limit of query
 */
export function getSelectStatementLimit(
    statement: string,
    language?: string
): Nullable<number> {
    const tokens = tokenize(statement, { language });
    const parsedStatement = simpleParse(tokens)?.[0] ?? [];

    // Strip nested statements out of the query
    const outerStatement: IToken[] = [];

    for (let tokenIdx = 0; tokenIdx < parsedStatement.length; tokenIdx++) {
        const token = parsedStatement[tokenIdx];
        if (token.bracketIndex != null) {
            tokenIdx = token.bracketIndex;
        } else if (token.type !== 'COMMENT') {
            outerStatement.push(token);
        }
    }

    // Only check SELECT / UNION statements
    // Ensure it has either a LIMIT or a FETCH clause
    if (!['select', 'union'].includes(getStatementType(outerStatement))) {
        return null;
    }

    const matchLimitPattern = tokenPatternMatch(outerStatement, [
        { type: 'KEYWORD', text: 'limit' },
        { type: 'NUMBER' },
    ]);

    if (matchLimitPattern) {
        return Number(matchLimitPattern[1].text);
    }

    const matchFetchFirstPattern = tokenPatternMatch(outerStatement, [
        { type: 'KEYWORD', text: 'fetch' },
        { type: 'KEYWORD' }, // could be first or next
        { type: 'NUMBER' },
        { type: 'KEYWORD', text: 'rows' },
    ]);
    if (matchFetchFirstPattern) {
        return Number(matchFetchFirstPattern[2].text);
    }

    return -1;
}

/**
 * Check if the query has any statements that is SELECT and does not have LIMIT
 * If so, return the unlimited select statement, else, return null
 *
 * @param query
 * @param language
 */
export function hasQueryContainUnlimitedSelect(
    query: string,
    language?: string
): string {
    const statements = getStatementsFromQuery(query, language);

    return statements.find(
        (statement) => getSelectStatementLimit(statement, language) === -1
    );
}

/**
 * Automatically apply a limit to a query that does not already have a limit.
 *
 * @param {string} query - Query to be executed.
 * @param {number} rowLimit - Number of rows to limit the query to.
 * @param {string} language - Language of the query.
 * @return {string} - Query with limit applied (if necessary).
 */
export function getLimitedQuery(
    query: string,
    rowLimit?: number,
    language?: string
): string {
    if (rowLimit == null) {
        return query;
    }

    const statements = getStatementsFromQuery(query, language);

    let addedLimit = false;
    const updatedQuery = statements
        .map((statement) => {
            const existingLimit = getSelectStatementLimit(statement, language);
            if (existingLimit == null || existingLimit >= 0) {
                return statement + ';';
            }

            addedLimit = true;
            return `${statement} limit ${rowLimit};`;
        })
        .join('\n');

    // If no limit was added, return the original query
    // to avoid changing whitespace, etc.
    return addedLimit ? updatedQuery : query;
}

// 10^1 to 10^5
export const ROW_LIMIT_SCALE =
    window.ROW_LIMIT_SCALE ?? [1, 2, 3, 4, 5].map((v) => Math.pow(10, v));
// 10^3
export const DEFAULT_ROW_LIMIT = window.DEFAULT_ROW_LIMIT ?? ROW_LIMIT_SCALE[2];
export const ALLOW_UNLIMITED_QUERY = window.ALLOW_UNLIMITED_QUERY ?? true;

if (!ROW_LIMIT_SCALE.includes(DEFAULT_ROW_LIMIT)) {
    throw new Error('DEFAULT_ROW_LIMIT must be in ROW_LIMIT_SCALE');
}
