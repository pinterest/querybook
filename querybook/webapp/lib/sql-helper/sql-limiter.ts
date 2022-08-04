import {
    containsKeyword,
    getStatementRanges,
    getStatementType,
    simpleParse,
    tokenize,
} from './sql-lexer';

/**
 * Automatically apply a limit to a query that does not already have a limit.
 *
 * @param {string} query - Query to be executed.
 * @param {rowLimit} query - Number of rows to limit the query to.
 * @param {language} query - Language of the query.
 * @return {string} - Query with limit applied (if necessary).
 */
export const getLimitedQuery = (
    query: string,
    rowLimit?: number,
    language?: string
): string => {
    if (rowLimit == null) {
        return query;
    }

    const statementRanges = getStatementRanges(query, null, language);
    const statements = statementRanges
        .map((range) => query.slice(range[0], range[1]))
        .filter((statement) => statement.length > 0);

    let addedLimit = false;
    const updatedQuery = statements
        .map((statement) => {
            const tokens = tokenize(statement, { language });
            const parsedStatements = simpleParse(tokens)[0];

            if (
                getStatementType(parsedStatements) === 'select' &&
                !containsKeyword(parsedStatements, 'limit') &&
                !containsKeyword(parsedStatements, 'fetch')
            ) {
                addedLimit = true;
                return `${statement} limit ${rowLimit};`;
            }

            return statement + ';';
        })
        .join('\n');

    // If no limit was added, return the original query
    // to avoid changing whitespace, etc.
    return addedLimit ? updatedQuery : query;
};
