import { find, uniqueId, invert } from 'lodash';
import { format as sqlFormatterFormat } from 'sql-formatter';

import { tokenize, IToken, getQueryLinePosition } from './sql-lexer';
import { getLanguageSetting } from './sql-setting';

// If the token falls under these types then do not
// format the insides of the token
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

export function format(
    query: string,
    language: string,
    options?: {
        case?: 'lower' | 'upper';
        indent?: string;
    }
) {
    options = {
        ...{
            // default options
            case: 'upper',
            indent: '  ',
        },
        ...options,
    };

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

    const queryLineLength = getQueryLinePosition(query);
    const newLineBetweenStatement = new Array(statements.length).fill(0);
    let lastStatementRange = null;

    const processedStatements = statements.map((statement, index) => {
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
    });

    const formattedStatements: string[] = processedStatements.map(
        ({ firstKeyWord, statementText, idToTemplateTag }) => {
            // Use standard formatter to format
            let formattedStatement = statementText;
            if (
                firstKeyWord &&
                allowedStatement.has(firstKeyWord.text.toLocaleLowerCase())
            ) {
                formattedStatement = sqlFormatterFormat(statementText, {
                    indent: options.indent,
                    language: getLanguageForSqlFormatter(language),
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

    return formattedStatements.reduce(
        (acc, statement, index) =>
            acc + '\n'.repeat(newLineBetweenStatement[index]) + statement,
        ''
    );
}

const SQL_FORMATTER_LANGUAGES = [
    'db2',
    'mariadb',
    'mysql',
    'n1ql',
    'plsql',
    'postgresql',
    'redshift',
    'spark',
    'sql',
    'tsql',
] as const;

type SqlFormatterLanguage = typeof SQL_FORMATTER_LANGUAGES[number];

function getLanguageForSqlFormatter(language: string): SqlFormatterLanguage {
    if ((SQL_FORMATTER_LANGUAGES as readonly string[]).includes(language)) {
        return language as SqlFormatterLanguage;
    }

    const languageSetting = getLanguageSetting(language);
    const requireBitwiseSupport = '|'.match(languageSetting.operatorChars);
    return requireBitwiseSupport ? 'mysql' : 'sql';
}
