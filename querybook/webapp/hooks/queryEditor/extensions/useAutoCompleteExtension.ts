import {
    autocompletion,
    Completion,
    CompletionContext,
    CompletionResult,
    startCompletion,
} from '@codemirror/autocomplete';
import { EditorView } from '@uiw/react-codemirror';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { CodeMirrorToken } from 'lib/codemirror/utils';
import { IPosition } from 'lib/sql-helper/sql-lexer';
import { SqlParser } from 'lib/sql-helper/sql-parser';

export type AutoCompleteType = 'none' | 'schema' | 'all';

// STATIC
const RESULT_MAX_LENGTH = 10;

export const useAutoCompleteExtension = ({
    view,
    sqlParserRef,
    type = 'all',
}: {
    view: EditorView;
    sqlParserRef: React.MutableRefObject<SqlParser>;
    type: AutoCompleteType;
}) => {
    const [typing, setTyping] = useState(false);

    const getColumnValueCompletions = useCallback(
        (cursor: IPosition, token: CodeMirrorToken): CompletionResult => {
            const [textBeforeEqual, textAfterEqual] = token.text
                .split('=')
                .map((s) => s.trim());
            const columnValues = sqlParserRef.current.getColumnValues(
                cursor,
                textBeforeEqual
            );

            const hasQuote = textAfterEqual.startsWith("'");
            return {
                from: token.to - textAfterEqual.length + (hasQuote ? 1 : 0),
                options: columnValues.map((v) => ({
                    label: `${v}`,
                    apply:
                        typeof v === 'number' || hasQuote ? `${v}` : `'${v}'`,
                })),
            };
        },
        [sqlParserRef]
    );

    const getGeneralCompletions = useCallback(
        async (
            context: string,
            cursor: IPosition,
            token: CodeMirrorToken
        ): Promise<CompletionResult> => {
            const tokenText = token.text.toLowerCase();
            const options: Completion[] = [];
            if (context === 'column') {
                const columns = sqlParserRef.current.getColumnMatches(
                    cursor,
                    token.text
                );
                options.push(
                    ...columns.map((column) => ({
                        label: column.name,
                        detail: 'column',
                    }))
                );
            } else if (context === 'table') {
                const tableNames =
                    await sqlParserRef.current.getTableNameMatches(tokenText);
                options.push(
                    ...tableNames.map((tableName) => ({
                        label: tableName,
                        detail: 'table',
                    }))
                );
            }

            // keyword may appear in all contexts
            const keywordMatches =
                type === 'all'
                    ? sqlParserRef.current.getKeyWordMatches(tokenText)
                    : [];

            options.push(
                ...keywordMatches.map((keyword) => ({
                    label: keyword,
                    detail: 'keyword',
                }))
            );

            let from = token.from;
            if (context === 'column') {
                from += token.text.lastIndexOf('.') + 1;
            }

            return { from, options };
        },
        [sqlParserRef, type]
    );

    const getCompletions = useCallback(
        async (context: CompletionContext) => {
            if (type === 'none') {
                return null;
            }

            // Get the token before the cursor, token could be in below foramts
            //  - column value: column = value (value may be quoted)
            const columnValueRegex = /(\w+\.)?\w+\s*=\s*['"]?\w*/;
            //  - column: schema.table.column, table.column, column
            //  - table: schema.table, table
            //  - keyword: any keyword
            const generalTokenRegex = /(\w+\.){0,2}\w*/;

            const columnValueToken = context.matchBefore(columnValueRegex);
            const generalToken =
                !columnValueToken && context.matchBefore(generalTokenRegex);

            // no token before the cursor, don't open completions.
            if (!columnValueToken?.text && !generalToken?.text) return null;

            // Get the cursor position in codemirror v5 format
            const cursorPos = context.pos;
            const line = context.state.doc.lineAt(cursorPos);
            const cursor = { line: line.number - 1, ch: cursorPos - line.from };

            const sqlParserContext =
                sqlParserRef.current.getContextAtPos(cursor);

            // handle the case where the token is a column and the user is trying to type a value in a where clause
            if (sqlParserContext === 'column' && columnValueToken?.text) {
                return getColumnValueCompletions(cursor, columnValueToken);
            }

            return getGeneralCompletions(
                sqlParserContext,
                cursor,
                generalToken
            );
        },
        [sqlParserRef, type, getColumnValueCompletions, getGeneralCompletions]
    );

    const triggerCompletionOnType = () => {
        return EditorView.updateListener.of((update) => {
            update.transactions.forEach((tr) => {
                if (
                    tr.isUserEvent('input.type') ||
                    tr.isUserEvent('delete.backward')
                ) {
                    setTyping(true);
                }
            });
        });
    };

    useEffect(() => {
        if (sqlParserRef.current.codeAnalysis && typing && view) {
            startCompletion(view);
            setTyping(false);
        }
    }, [sqlParserRef.current.codeAnalysis, view]);

    const extension = useMemo(
        () => [
            autocompletion({
                icons: false,
                override: [getCompletions],
                activateOnTyping: true,
                maxRenderedOptions: RESULT_MAX_LENGTH,
            }),
            triggerCompletionOnType(),
        ],
        []
    );

    return extension;
};
