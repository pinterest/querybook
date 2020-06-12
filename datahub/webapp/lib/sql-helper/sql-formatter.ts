import { find, uniqueId, invert } from 'lodash';
import SqlFormattor from 'sql-formatter';

import { tokenize, IToken, getQueryLinePosition } from './sql-lexer';

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

        if (token.type === 'TEMPLATED_TAG') {
            if (!(token.string in templateTagToId)) {
                templateTagToId[token.string] = uniqueId('__TEMPLATED_TAG_');
            }
            statementText += templateTagToId[token.string];
        } else {
            statementText += token.string;
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

    const tokens = tokenize(query, language);
    const statements: IToken[][] = [];
    tokens.reduce((statement, token, index) => {
        if (token.type === 'KEYWORD' && options.case) {
            if (options.case === 'lower') {
                token.string = token.string.toLocaleLowerCase();
            } else if (options.case === 'upper') {
                token.string = token.string.toLocaleUpperCase();
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
                allowedStatement.has(firstKeyWord.string.toLocaleLowerCase())
            ) {
                formattedStatement = SqlFormattor.format(statementText, {
                    indent: options.indent,
                });
            }

            for (const [id, templateTag] of Object.entries(idToTemplateTag)) {
                formattedStatement = formattedStatement.replace(
                    new RegExp(id, 'g'),
                    templateTag
                );
            }

            // TODO(datahub) implement formatting for general purposes
            return formattedStatement;
        }
    );

    return formattedStatements.reduce((acc, statement, index) => {
        return acc + '\n'.repeat(newLineBetweenStatement[index]) + statement;
    }, '');
}
