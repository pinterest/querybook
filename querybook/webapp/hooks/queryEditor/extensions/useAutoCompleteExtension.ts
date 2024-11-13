import {
    autocompletion,
    CompletionContext,
    startCompletion,
} from '@codemirror/autocomplete';
import { EditorView } from '@uiw/react-codemirror';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { SqlAutoCompleter } from 'lib/sql-helper/sql-autocompleter';

// STATIC
const RESULT_MAX_LENGTH = 10;

export const useAutoCompleteExtension = ({
    view,
    autoCompleterRef,
}: {
    view: EditorView;
    autoCompleterRef: React.MutableRefObject<SqlAutoCompleter>;
}) => {
    const [typing, setTyping] = useState(false);

    const getCompletions = useCallback(async (context: CompletionContext) => {
        // Get the token before the cursor, token could be schema.table.column
        const token = context.matchBefore(/(\w+\.){0,2}(\w+)?/);
        // is no word before the cursor, don't open completions.
        if (!token || !token.text) return null;

        const cursorPos = context.pos;
        const line = context.state.doc.lineAt(cursorPos);
        const cursor = { line: line.number - 1, ch: cursorPos - line.from };

        const completions = await autoCompleterRef.current.getCompletions(
            cursor,
            token
        );
        return completions;
    }, []);

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
        if (autoCompleterRef.current.codeAnalysis && typing && view) {
            startCompletion(view);
            setTyping(false);
        }
    }, [autoCompleterRef.current.codeAnalysis, view]);

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
