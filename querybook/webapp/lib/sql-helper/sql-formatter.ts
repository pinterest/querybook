import { getQueryLinePosition, IToken, tokenize } from './sql-lexer';
import { find, invert, uniqueId } from 'lodash';
import { format as sqlFormat, supportedDialects } from 'sql-formatter';

const skipTokenType = new Set(['TEMPLATED_TAG', 'TEMPLATED_BLOCK', 'URL']);

const allowedStatement = new Set([
    'select',
    'insert',
    'delete',
    'update',
    'alter',
    'create',
    'desc',
    'with',
    'describe',
    'show',
]);

function tokensToText(tokens: IToken[]) {
    let statementText = '';
    const templateTagToId = {};
    let lastToken: IToken = null;

    for (const token of tokens) {
        if (lastToken) {
            if (token.line !== lastToken.line) {
                statementText += '\n';
            } else if (token.start > lastToken.end) {
                statementText += ' ';
            }
        }

        if (skipTokenType.has(token.type)) {
            if (!(token.text in templateTagToId)) {
                templateTagToId[token.text] = uniqueId('__TEMPLATED_TAG_');
            }
            statementText += templateTagToId[token.text];
        } else {
            statementText += token.text;
        }
        lastToken = token;
    }

    return {
        statementText,
        idToTemplateTag: invert(templateTagToId),
    };
}

export interface ISQLFormatOptions {
    case?: 'lower' | 'upper';
    tabWidth?: number;
    useTabs?: boolean;

    /**
     * whether or not to thrown error when encoutering a parsing
     * error, defaults to true
     */
    silent?: boolean;
}

interface IProcessedStatement {
    statementText: string;
    idToTemplateTag: Record<string, string>;
    firstKeyWord: IToken;
}

function tokenizeAndFormatQuery(
    query: string,
    language: string,
    options: ISQLFormatOptions
) {
    const tokens = tokenize(query, { language, includeUnknown: true });
    const statements: IToken[][] = [];
    tokens.reduce((statement, token, index) => {
        if (token.type === 'KEYWORD' && options.case) {
            if (options.case === 'lower') {
                token.text = token.text.toLocaleLowerCase();
            } else if (options.case === 'upper') {
                token.text = token.text.toLocaleUpperCase();
            }
        }

        statement.push(token);

        if (token.type === 'SEMI') {
            statements.push(statement);
            return [];
        } else if (index === tokens.length - 1) {
            statements.push(statement);
        }

        return statement;
    }, [] as IToken[]);

    return statements;
}

function processStatements(
    query: string,
    language: string,
    options: ISQLFormatOptions
) {
    const statements = tokenizeAndFormatQuery(query, language, options);
    const queryLineLength = getQueryLinePosition(query);
    const newLineBetweenStatement = new Array(statements.length).fill(0);
    let lastStatementRange = null;

    const processedStatements: IProcessedStatement[] = statements.map(
        (statement, index) => {
            // This part of code calculates the number of new lines
            // between 2 statements
            const firstToken = statement[0];
            const lastToken = statement[statement.length - 1];
            const statementRange = [
                queryLineLength[firstToken.line] + firstToken.start,
                queryLineLength[lastToken.line] + lastToken.end,
            ];
            if (lastStatementRange) {
                const inbetweenString = query.slice(
                    lastStatementRange[1],
                    statementRange[0]
                );
                const numberOfNewLine = inbetweenString.split('\n').length - 1;
                newLineBetweenStatement[index] = Math.max(1, numberOfNewLine);
            }
            lastStatementRange = statementRange;

            // This part of code formats the query
            const firstKeyWord = find(
                statement,
                (token) => token.type === 'KEYWORD'
            );
            const { statementText, idToTemplateTag } = tokensToText(statement);

            return {
                statementText,
                idToTemplateTag,
                firstKeyWord,
            };
        }
    );

    return {
        newLineBetweenStatement,
        processedStatements,
    };
}

function formatEachStatement(
    statements: IProcessedStatement[],
    language: string,
    options: ISQLFormatOptions
) {
    return statements.map(
        ({ firstKeyWord, statementText, idToTemplateTag }) => {
            // Use standard formatter to format
            let formattedStatement = statementText;
            if (
                firstKeyWord &&
                allowedStatement.has(firstKeyWord.text.toLocaleLowerCase())
            ) {
                formattedStatement = sqlFormat(statementText, {
                    tabWidth: options.tabWidth,
                    language: getLanguageForSqlFormatter(language),
                    useTabs: options.useTabs,
                });
            }

            for (const [id, templateTag] of Object.entries(idToTemplateTag)) {
                formattedStatement = formattedStatement.replace(
                    new RegExp(id, 'g'),
                    templateTag
                );
            }

            return formattedStatement;
        }
    );
}

export function format(
    query: string,
    language: string,
    options?: ISQLFormatOptions
) {
    options = {
        ...{
            // default options
            case: 'upper',
            tabWidth: 2,
            useTabs: false,
            silent: true,
        },
        ...options,
    };

    try {
        const { processedStatements, newLineBetweenStatement } =
            processStatements(query, language, options);
        const formattedStatements = formatEachStatement(
            processedStatements,
            language,
            options
        );

        return formattedStatements.reduce(
            (acc, statement, index) =>
                acc + '\n'.repeat(newLineBetweenStatement[index]) + statement,
            ''
        );
    } catch (e) {
        if (options.silent) {
            return query;
        } else {
            throw e;
        }
    }
}

// Override according to https://github.com/sql-formatter-org/sql-formatter/blob/master/docs/language.md
const languageMappingOverride = {
    presto: 'trino',
    sparksql: 'spark',
};

function getLanguageForSqlFormatter(language: string): string {
    if (supportedDialects.includes(language)) {
        return language;
    }

    if (language in languageMappingOverride) {
        return languageMappingOverride[language];
    }

    return 'sql';
}
