import { getLanguageSetting } from './sql-setting';

const keepTokenType = new Set([
    'KEYWORD',
    'BRACKET',
    'SEMI',
    'VARIABLE',
    'NUMBER',
]);

// We look for actual table name table these keyword
const tableKeyWord = new Set(['table', 'from', 'join', 'into']);

const dmlKeyWord = new Set([
    'select',
    'insert',
    'update',
    'delete',
    'with',
    'create',
    'alter',
    'drop',
]);
// we ignore these keywords and keep looking
const continueTableSearchKeyWord = new Set([
    'if',
    'not',
    'exists',
    'formatted',
    'repair',
    'partitions',
    'extended',
]);

// We find table if it is these statements, but they have to be at the front
// since desc can also mean descending
const initialStatementTableKeyWord = new Set([
    'describe',
    'desc',
    'show',
    'msck',
]);

// We find table if it is these statements
const initialStatementKeyWord = new Set([
    ...dmlKeyWord,
    ...initialStatementTableKeyWord,
    'use',
]);

// There are 3 context: none, table, column
const contextSensitiveKeyWord = {
    select: 'column',
    from: 'table',
    where: 'column',
    by: 'column',
    // insert,
    table: 'table',
    update: 'table',
    join: 'table',
    set: 'column',

    desc: 'table',
    describe: 'table',

    // delete: 'table',

    limit: 'none',
};

function getTokenTypeMatcher(language: string) {
    const languageSetting = getLanguageSetting(language);
    return [
        {
            name: 'NUMBER',
            regex: [
                /^0x[0-9a-f]+/, // HEX
                /^x'[0-9a-f]+'/, // HEX
                /^b'[01]+'/, // BINARY
                /^0b[01]+/, // BINARY
                /^[0-9]+(\.[0-9]+)?([e][-+]?[0-9])?/, // DECIMAL
                /^{( )*(d|t|ts)( )*'[^']*'( )*}/, // DATE
                /^{( )*(d|t|ts)( )*"[^"]*"( )*}/, // DATE
                /^[0-9]+/,
            ],
        },
        {
            name: 'STRING',
            regex: [/^"(\\.|[^"])*"/, /^'(\\.|[^'])*'/, /^['"]/],
        },
        {
            name: 'COMMENT',
            regex: [/^--.*/, /^\/\*/],
        },
        {
            name: 'OPERATOR',
            regex: [languageSetting.operatorChars],
        },
        {
            name: 'PUNCTUATION',
            regex: [languageSetting.punctuationChars],
        },
        {
            name: 'BRACKET',
            regex: [/^[\(\)\[\]]/],
        },
        {
            name: 'SEMI',
            regex: [/^;/],
        },
        {
            name: 'COMMA',
            regex: [/^,/],
        },

        {
            name: 'TEMPLATED_TAG',
            regex: languageSetting.placeholderVariable
                ? [/^{{.*?}}/, languageSetting.placeholderVariable]
                : [/^{{.*?}}/],
        },
        {
            name: 'TEMPLATED_BLOCK',
            regex: [/^{%.*?%}/, /^{#.*?#}/, /^#.*?/],
        },
        {
            name: 'URL',
            regex: [/^[a-z0-9]+:\/\/[A-Za-z0-9_.\-~/]+/],
        },
        {
            name: 'VARIABLE',
            regex: [/^(\w+|`.*`)(?:\.(\w+|`.*`)?)+/],
        },
        {
            name: 'WORD',
            regex: [/^\w+/],
        },
    ];
}

export interface IRange {
    from: CodeMirror.Position;
    to: CodeMirror.Position;
}

export interface ILinterWarning extends IRange {
    message: string;
    severity: 'error' | 'warning';
}

export interface ILineage {
    references: Record<number, TableToken[]>;
    aliases: Record<number, Record<string, TableToken>>;
}

export interface ICodeAnalysis {
    lineage: ILineage;
    editorLines?: Line[];
    contextFreeLinterWarnings?: ILinterWarning[];
}

class StringStream {
    public string: string;
    public pos: number;

    constructor(s: string) {
        this.string = s;
        this.pos = 0;
    }

    public next() {
        if (!this.eol()) {
            return this.string.charAt(this.pos++);
        }
    }

    public peek() {
        return this.string.charAt(this.pos);
    }

    public eol() {
        return this.pos >= this.string.length;
    }

    public match(pattern, consume = false) {
        const match = this.string.slice(this.pos).match(pattern);
        if (match && consume) {
            this.pos += match.index + match[0].length;
        }
        return match;
    }

    public eatSpace() {
        const start = this.pos;
        while (/\s/.test(this.string.charAt(this.pos))) {
            this.pos++;
        }
        return this.pos - start;
    }

    public goToEnd() {
        this.pos = this.string.length;
    }
}

export interface IToken {
    type: string;
    raw_type: string;
    string: string;
    line: number;
    start: number;
    end: number;
    bracketIndex?: number;
}

export class TableToken {
    public schema: string;
    public name: string;
    public line: number;
    public start: number;
    public end: number;

    constructor(schema, table, token) {
        this.schema = schema;
        this.name = table;
        this.line = token.line;
        this.start = token.start;
        this.end = token.end;
    }
}

class Line {
    public statements: Array<[number, number]>;
    public contexts: Array<[number, string]>;

    constructor(initialStatement: number, initialContext: string) {
        this.statements = [[0, initialStatement]];
        this.contexts = [[0, initialContext]];
    }
}

function sanitizeTable(tableToken: IToken, defaultSchema: string) {
    const stream = new StringStream(tableToken.string);
    const parts = [];
    while (!stream.eol()) {
        const match = stream.match(/^([_\w\d]+|`.*`)\.?/, true);
        if (match[1]) {
            let part = match[1];
            if (part.charAt(0) === '`') {
                // remove first and last char
                part = part.slice(1, -1);
            }
            parts.push(part);
        }
    }

    let schema: string = null;
    let table: string = null;
    let success = true;

    if (parts.length === 1) {
        schema = defaultSchema;
        table = parts[0];
    } else if (parts.length === 2) {
        schema = parts[0];
        table = parts[1];
    } else {
        console.error('Erroneous Input');
        console.error(tableToken);
        success = false;
    }

    return {
        schema: (schema || '').toLowerCase(),
        table: (table || '').toLowerCase(),
        success,
    };
}

function categorizeWord(token: IToken, language: string) {
    const languageSetting = getLanguageSetting(language);
    const s = token.string.toLowerCase();
    if (languageSetting.keywords.has(s)) {
        token.type = 'KEYWORD';
        token.string = s;
    } else if (languageSetting.bool.has(s)) {
        token.type = 'BOOL';
    } else if (languageSetting.type.has(s)) {
        token.type = 'TYPE';
    } else {
        token.type = 'VARIABLE';
    }
}

function makeTokenizer(language: string) {
    const tokenTypes = getTokenTypeMatcher(language);
    function tokenizeString(
        token: IToken,
        stream: StringStream,
        tokens: IToken[],
        lineNum: number
    ) {
        let previousEscape = false;
        const quote = token.string.charAt(0);
        const start = stream.pos;
        while (!stream.eol()) {
            const ch = stream.next();
            if (!previousEscape) {
                if (ch === quote) {
                    // End
                    const end = stream.pos;
                    token.string =
                        token.string + stream.string.slice(start, end);
                    token.end = end;
                    tokens.push(token);

                    return tokenizeBase;
                } else if (ch === '\\') {
                    previousEscape = true;
                }
            } else {
                previousEscape = false;
            }
        }

        token.string = token.string + stream.string.slice(start) + '\n';
        return tokenizeString.bind(null, token);
    }

    function tokenizeComment(
        token: IToken,
        stream: StringStream,
        tokens: IToken[],
        lineNum: number
    ) {
        const start = stream.pos;
        if (!stream.eol()) {
            const match = stream.match(/\*\//, true);
            if (match) {
                const end = stream.pos;
                token.string = token.string + stream.string.slice(start, end);
                token.end = end;
                tokens.push(token);

                return tokenizeBase;
            }
        }

        token.string = token.string + stream.string.slice(start) + '\n';
        stream.goToEnd();
        return tokenizeComment.bind(null, token);
    }

    function tokenizeBase(
        stream: StringStream,
        tokens: IToken[],
        lineNum: number
    ) {
        stream.eatSpace();

        let token: IToken = null;
        const tokenFound = tokenTypes.some(
            ({ name: tokenType, regex: tokenRegexs }) => {
                return tokenRegexs.some((tokenRegex) => {
                    const match = stream.match(tokenRegex, true);
                    if (match) {
                        const end = stream.pos;
                        const start = stream.pos - match[0].length;

                        token = {
                            type: tokenType,
                            raw_type: tokenType,
                            string: match[0],
                            line: lineNum,
                            start,
                            end,
                        };
                        return true;
                    }
                });
            }
        );

        if (tokenFound) {
            if (token.type === 'WORD') {
                categorizeWord(token, language);
            } else if (token.type === 'STRING' && token.string.length === 1) {
                // Multi-line string!
                // Change the mode to tokenizeString instead!
                return tokenizeString.bind(null, token);
            } else if (token.type === 'COMMENT' && token.string === '/*') {
                return tokenizeComment.bind(null, token);
            }

            tokens.push(token);
        } else {
            stream.next();
        }

        return tokenizeBase;
    }

    return tokenizeBase;
}

export function tokenize(code: string, language?: string) {
    const lines = code.split('\n');
    const tokens: IToken[] = [];
    let tokenizer = makeTokenizer(language || 'hive');
    lines.forEach((line, lineNum) => {
        const stream = new StringStream(line);
        while (!stream.eol()) {
            tokenizer = tokenizer(stream, tokens, lineNum);
        }
    });
    return tokens;
}

export function simpleParse(tokens: IToken[]) {
    const statements: IToken[][] = [];
    let bracketStack = [];

    let statement: IToken[] = [];
    tokens.forEach((token) => {
        if (keepTokenType.has(token.type)) {
            if (token.type === 'BRACKET') {
                statement.push(token);
                if (token.string === '(' || token.string === '[') {
                    bracketStack.push(token);
                } else if (bracketStack.length > 0) {
                    // ) or ]
                    const correspondingToken = bracketStack.pop();
                    correspondingToken.bracketIndex = statement.length - 1;
                }
            } else if (token.type === 'SEMI') {
                bracketStack.forEach((bracketToken) => {
                    bracketToken.bracketIndex = statement.length - 1;
                });
                statements.push(statement);

                statement = [];
                bracketStack = [];
            } else {
                statement.push(token);
            }
        }
    });

    if (statement.length > 0) {
        bracketStack.forEach((token) => {
            token.bracketIndex = statement.length - 1;
        });
        statements.push(statement);
    }

    return statements;
}

export function getQueryLinePosition(query: string) {
    // Return start char position of every line
    // the return array is always 1 + number of lines in query
    return query
        .split('\n')
        .map((line) => line.length)
        .reduce(
            (arr, lineLength) => {
                arr.push(lineLength + 1 + arr[arr.length - 1]);
                return arr;
            },
            [0]
        );
}

// selectedRange is either null or { from: {line:num, ch:num}, to: {line:num, ch:num}}
export function getStatementRanges(
    query: string,
    selectedRange = null,
    language?: string
) {
    language = language || 'hive';
    // Calculate char position of beginning of each line
    let queryStartPos = 0;
    let queryEndPos = query.length;

    if (selectedRange) {
        const queryLineLength = getQueryLinePosition(query);
        queryStartPos =
            queryLineLength[selectedRange.from.line] + selectedRange.from.ch;
        queryEndPos =
            queryLineLength[selectedRange.to.line] + selectedRange.to.ch;
    }

    const selectedQuery = query.substring(queryStartPos, queryEndPos);
    const lineLength = getQueryLinePosition(selectedQuery);

    const tokens = tokenize(selectedQuery, language);

    // a list of statement tokens
    const tokenStatements: IToken[][] = [];
    // a list of tokens
    let tokenStatement: IToken[] = [];

    tokens.forEach((token) => {
        if (token.type === 'SEMI') {
            tokenStatements.push(tokenStatement);
            tokenStatement = [];
        } else if (token.type === 'COMMENT') {
            // ignore comment tokens
        } else {
            tokenStatement.push(token);
        }
    });
    if (tokenStatement.length > 0) {
        tokenStatements.push(tokenStatement);
    }

    // Now crop ranges for each statement
    const statementRanges = tokenStatements
        .filter((statement) => statement.length > 0) // Filter out empty statements
        .map((statement) => {
            const firstToken = statement[0];
            const lastToken = statement[statement.length - 1];

            const firstCharPosition =
                lineLength[firstToken.line] + firstToken.start;
            const lastCharPosition = lineLength[lastToken.line] + lastToken.end;

            return [
                firstCharPosition + queryStartPos,
                lastCharPosition + queryStartPos,
            ];
        });

    return statementRanges;
}

export function getSelectedQuery(query: string, selectedRange: IRange = null) {
    const statementRanges = selectedRange
        ? getStatementRanges(query, selectedRange)
        : [];
    const queryRange =
        statementRanges.length > 0
            ? [
                  statementRanges[0][0],
                  statementRanges[statementRanges.length - 1][1],
              ]
            : null;
    const selectedQuery = queryRange
        ? query.slice(queryRange[0], queryRange[1])
        : query;
    return selectedQuery;
}

export function getQueryAsExplain(query: string, language?: string) {
    const statementRanges = getStatementRanges(query, language);
    const statements = statementRanges.map((range) =>
        query.slice(range[0], range[1])
    );
    return statements.map((statement) => 'EXPLAIN ' + statement).join('\n');
}

function findWithStatementPlaceholder(statement: IToken[]) {
    const placeholders: IToken[] = [];
    let tokenIndex = 1;
    while (tokenIndex < statement.length) {
        const token = statement[tokenIndex++];
        if (token.type === 'VARIABLE') {
            placeholders.push(token);
        } else if (token.type === 'BRACKET' && token.bracketIndex) {
            tokenIndex = token.bracketIndex + 1;
        } else if (token.type === 'KEYWORD' && dmlKeyWord.has(token.string)) {
            break;
        }
    }

    return placeholders;
}

export function findTableReferenceAndAlias(statements: IToken[][]) {
    let defaultSchema = 'default';
    const references: Record<number, TableToken[]> = {};
    const aliases: Record<number, Record<string, TableToken>> = {};

    statements.forEach((statement, statementNum) => {
        if (statement.length === 0) {
            return;
        }

        let tokenCounter = 0;
        let firstToken = statement[tokenCounter++];
        if (
            firstToken.type === 'KEYWORD' &&
            firstToken.string === 'explain' &&
            statement.length > 1
        ) {
            firstToken = statement[tokenCounter++];
        }

        if (
            firstToken.type !== 'KEYWORD' ||
            !initialStatementKeyWord.has(firstToken.string)
        ) {
            return;
        }

        if (firstToken.string === 'use') {
            const secondToken = statement[tokenCounter++];
            if (secondToken && secondToken.type === 'VARIABLE') {
                defaultSchema = secondToken.string;
            }
        } else {
            let placeholders: Set<string> = null;
            if (firstToken.string === 'with') {
                placeholders = new Set(
                    findWithStatementPlaceholder(statement).map(
                        (token) => token.string
                    )
                );
            }
            const tables: IToken[] = [];
            const tableAlias: Record<string, IToken> = {};
            let tableSearchMode = false;
            let lastTableIndex = -1;

            statement.forEach((token, tokenIndex) => {
                if (token.type === 'KEYWORD') {
                    if (tableKeyWord.has(token.string)) {
                        tableSearchMode = true;
                    } else if (
                        tokenIndex === 0 &&
                        initialStatementTableKeyWord.has(token.string)
                    ) {
                        tableSearchMode = true;
                    } else if (!continueTableSearchKeyWord.has(token.string)) {
                        tableSearchMode = false;
                    }
                } else if (token.type === 'BRACKET') {
                    tableSearchMode = false;
                } else if (token.type === 'VARIABLE') {
                    if (tableSearchMode) {
                        const isActualTable = !(
                            placeholders && placeholders.has(token.string)
                        ) && token.raw_type === 'VARIABLE';;

                        if (isActualTable) {
                            tables.push(token);
                            lastTableIndex = tokenIndex;
                        }
                        tableSearchMode = false;
                    } else if (tokenIndex > 0) {
                        // check alias
                        const prevToken = statement[tokenIndex - 1];
                        const hasPrestoAlias =
                            prevToken.type === 'KEYWORD' &&
                            prevToken.string === 'AS' &&
                            lastTableIndex + 2 === tokenIndex;
                        const hasHiveAlias = lastTableIndex + 1 === tokenIndex;
                        if (hasPrestoAlias || hasHiveAlias) {
                            const tableToken = tables[tables.length - 1];
                            const isActualTable = !(
                                placeholders && placeholders.has(token.string)
                            );
                            if (isActualTable) {
                                tableAlias[token.string] = tableToken;
                            }
                        }
                    }
                }
            });

            // Post Process Tables
            const processedTables = [];
            tables.forEach((tableToken) => {
                const { schema, table, success } = sanitizeTable(
                    tableToken,
                    defaultSchema
                );
                if (success) {
                    processedTables.push(
                        new TableToken(schema, table, tableToken)
                    );
                }
            });
            references[statementNum] = processedTables;

            // Post Process Alias
            const processedAlias: Record<string, TableToken> = {};
            Object.keys(tableAlias).forEach((alias) => {
                const tableToken = tableAlias[alias];
                const { schema, table, success } = sanitizeTable(
                    tableToken,
                    defaultSchema
                );
                if (success) {
                    processedAlias[alias] = new TableToken(
                        schema,
                        table,
                        tableToken
                    );
                }
            });
            aliases[statementNum] = processedAlias;
        }
    });
    return {
        references,
        aliases,
    };
}

export function getEditorLines(statements: IToken[][]) {
    const lines: Line[] = [];
    let lastLine = 0;

    statements.forEach((statement, statementNum) => {
        let context = 'none';
        const contextStack: string[] = [];

        statement.forEach((token) => {
            const tokenLine = token.line;
            let tokenPosition = token.end;

            for (let lineNum = lastLine; lineNum <= tokenLine; lineNum++) {
                if (lines[lineNum] == null) {
                    lines[lineNum] = new Line(statementNum, context);
                }
            }

            let needToUpdateLine = false;
            if (
                token.type === 'KEYWORD' &&
                token.string in contextSensitiveKeyWord
            ) {
                context = contextSensitiveKeyWord[token.string];
                tokenPosition += 1;
                needToUpdateLine = true;
            } else if (token.type === 'SEMI') {
                context = 'none';
                needToUpdateLine = true;
            } else if (token.type === 'BRACKET') {
                if (token.string === '(' || token.string === '[') {
                    contextStack.push(context);
                    // However context don't change because there may be the case of
                    // select count(* <---)
                    needToUpdateLine = true;
                } else if (contextStack.length > 0) {
                    // ) or ]
                    context = contextStack.pop();
                    needToUpdateLine = true;
                }
            } else if (context === 'table' && token.type === 'VARIABLE') {
                context = 'none';
                tokenPosition += 1;
                needToUpdateLine = true;
            }

            if (needToUpdateLine) {
                const {
                    statements: currentStatements,
                    contexts: currentContexts,
                } = lines[tokenLine];

                const lastStatement =
                    currentStatements[currentStatements.length - 1];
                const lastContext = currentContexts[currentContexts.length - 1];

                if (lastStatement[0] === tokenPosition) {
                    lastStatement[1] = statementNum;
                } else if (lastStatement[1] !== statementNum) {
                    currentStatements.push([tokenPosition, statementNum]);
                }

                if (lastContext[0] === tokenPosition) {
                    lastContext[1] = context;
                } else if (lastContext[1] !== context) {
                    currentContexts.push([tokenPosition, context]);
                }
            }

            lastLine = tokenLine;
        });
    });

    return lines;
}
