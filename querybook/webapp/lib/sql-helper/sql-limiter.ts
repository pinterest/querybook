import {
    containsKeyword,
    getStatementRanges,
    getStatementType,
    IToken,
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
            const parsedStatement = simpleParse(tokens)[0];

            // Strip nested statements out of the query
            const outerStatement: IToken[] = [];
            let nesting = 0;
            for (const token of parsedStatement) {
                if (token.type === 'BRACKET') {
                    if (token.text === '(' || token.text === '[') {
                        nesting++;
                    } else if (token.text === ')' || token.text === ']') {
                        nesting--;
                    }
                } else if (nesting === 0) {
                    outerStatement.push(token);
                }
            }

            // Only check SELECT / UNION statements
            // Ensure it has either a LIMIT or a FETCH clause
            if (
                ['select', 'union'].includes(
                    getStatementType(outerStatement)
                ) &&
                !containsKeyword(outerStatement, 'limit') &&
                !containsKeyword(outerStatement, 'fetch')
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
