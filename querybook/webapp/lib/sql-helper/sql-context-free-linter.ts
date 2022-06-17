import { ICodeAnalysis, ILinterWarning, IToken } from './sql-lexer';

export function getContextFreeLinterWarnings(
    statements: IToken[][],
    language: string,
    codeAnalysis: ICodeAnalysis
) {
    let warnings: ILinterWarning[] = [];
    if (language in contextFreeLinterWarningsByLanguage) {
        warnings = warnings.concat(
            contextFreeLinterWarningsByLanguage[language](
                statements,
                codeAnalysis
            )
        );
    }

    return warnings;
}

const contextFreeLinterWarningsByLanguage: Record<
    string,
    (statements: IToken[][], codeAnalysis: ICodeAnalysis) => ILinterWarning[]
> = {
    hive: (statements) => {
        const warnings: ILinterWarning[] = [];
        for (const statement of statements) {
            if (statement.length === 0) {
                continue;
            }

            for (const [tokenIdx, token] of statement.entries()) {
                if (token.type === 'KEYWORD' && token.text === 'count') {
                    const countDistinctTokens = statement.slice(
                        tokenIdx,
                        tokenIdx + 3
                    );
                    if (countDistinctTokens.length === 3) {
                        const [_, bracket, distinct] = countDistinctTokens;
                        if (
                            bracket.type === 'BRACKET' &&
                            bracket.text === '(' &&
                            distinct.type === 'KEYWORD' &&
                            distinct.text === 'distinct'
                        ) {
                            warnings.push({
                                message:
                                    'Do a "count(*) and group by" works better in terms of performance.',
                                severity: 'warning',
                                from: {
                                    line: token.line,
                                    ch: token.start,
                                },
                                to: {
                                    line: distinct.line,
                                    ch: distinct.end,
                                },
                            });
                        }
                    }
                }
            }
        }
        return warnings;
    },
    presto: (statements) => {
        const warnings: ILinterWarning[] = [];
        statements.forEach((statement) => {
            if (statement.length === 0) {
                return;
            }

            const firstToken = statement[0];
            if (firstToken.type === 'KEYWORD' && firstToken.text === 'select') {
                // SELECT statement

                // Must have limit check
                const lastTokens = statement.slice(-2);
                if (lastTokens.length === 2) {
                    const [limitToken, numberToken] = lastTokens;

                    const isLimitToken =
                        limitToken.type === 'KEYWORD' &&
                        limitToken.text === 'limit';
                    const isNumberToken = numberToken.type === 'NUMBER';

                    if (!isLimitToken || !isNumberToken) {
                        warnings.push({
                            message: 'Please add a LIMIT clause',
                            severity: 'warning',
                            from: {
                                line: firstToken.line,
                                ch: firstToken.start,
                            },
                            to: {
                                line: firstToken.line,
                                ch: firstToken.end,
                            },
                        });
                    }
                }
            }
        });

        return warnings;
    },
};
