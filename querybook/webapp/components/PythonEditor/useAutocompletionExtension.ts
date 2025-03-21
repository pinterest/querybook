import {
    autocompletion,
    completeFromList,
    CompletionContext,
    CompletionResult,
    startCompletion,
} from '@codemirror/autocomplete';
import {
    globalCompletion,
    localCompletionSource,
} from '@codemirror/lang-python';
import { EditorView } from '@uiw/react-codemirror';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type AutoCompleteType = 'none' | 'schema' | 'all';

// STATIC
const RESULT_MAX_LENGTH = 10;

export const useAutocompletionExtension = ({
    view,
    namespaceIdentifiers,
}: {
    view: EditorView;
    namespaceIdentifiers: { name: string; type: string }[];
}) => {
    const [typing, setTyping] = useState(false);

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

    const getGlobalCompletions = useCallback(
        (context: CompletionContext): CompletionResult => {
            const originalResult = globalCompletion(
                context
            ) as CompletionResult;
            if (!originalResult) {
                return null;
            }
            return {
                ...originalResult,
                options: originalResult.options.map((option) => ({
                    label: option.label,
                    detail: option.type,
                })),
            };
        },
        [globalCompletion]
    );

    const getLocalCompletions = useCallback(
        (context: CompletionContext): CompletionResult => {
            const originalResult = localCompletionSource(context);
            if (!originalResult) {
                return null;
            }
            return {
                ...originalResult,
                options: originalResult.options.map((option) => ({
                    label: option.label,
                    detail: option.type,
                })),
            };
        },
        [localCompletionSource]
    );

    const getNamespaceCompletions = useMemo(
        () =>
            completeFromList(
                namespaceIdentifiers.map(({ name, type }) => ({
                    label: name,
                    detail: type,
                }))
            ),
        [namespaceIdentifiers]
    );

    useEffect(() => {
        if (typing && view) {
            startCompletion(view);
            setTyping(false);
        }
    }, [typing, view]);

    const extension = useMemo(
        () => [
            autocompletion({
                override: [
                    getGlobalCompletions,
                    getLocalCompletions,
                    getNamespaceCompletions,
                ],
                icons: false,
                activateOnTyping: true,
                maxRenderedOptions: RESULT_MAX_LENGTH,
            }),
            triggerCompletionOnType(),
        ],
        [
            autocompletion,
            getGlobalCompletions,
            getLocalCompletions,
            getNamespaceCompletions,
        ]
    );

    return extension;
};
