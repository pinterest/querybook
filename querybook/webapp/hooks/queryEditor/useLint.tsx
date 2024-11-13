import { Diagnostic } from '@codemirror/lint';
import { EditorView } from '@uiw/react-codemirror';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';

import { LintTooltip } from 'components/CodeMirrorTooltip/LintTooltip';
import { TDataDocMetaVariables } from 'const/datadoc';
import { IQueryValidationResult } from 'const/queryExecution';
import { useDebounce } from 'hooks/useDebounce';
import useDeepCompareEffect from 'hooks/useDeepCompareEffect';
import { posToOffset } from 'lib/codemirror/utils';
import { getContextSensitiveWarnings } from 'lib/sql-helper/sql-context-sensitive-linter';
import { ILinterWarning, TableToken } from 'lib/sql-helper/sql-lexer';
import { TemplatedQueryResource } from 'resource/queryExecution';

const getDiagnosticRenderer =
    ({
        from,
        to,
        message,
        suggestion,
    }: {
        from: number;
        to: number;
        message: string;
        suggestion: string;
    }): ((view: EditorView) => Node) =>
    (view: EditorView) => {
        const container = document.createElement('div');

        ReactDOM.render(
            <LintTooltip
                message={message}
                suggestion={suggestion}
                onAcceptSuggestion={(suggestion) => {
                    view.dispatch({
                        changes: { from, to, insert: suggestion },
                    });
                }}
                readonly={!view.state.facet(EditorView.editable)}
            />,
            container
        );

        return container;
    };

const getQueryValidationErrors = async (
    query: string,
    engineId: number,
    templatedVariables: TDataDocMetaVariables
) => {
    const { data: validationResults } =
        await TemplatedQueryResource.validateQuery(
            query,
            engineId,
            templatedVariables
        );

    return validationResults;
};

const queryValidationErrorsToDiagnostics = (
    editorView: EditorView,
    queryValidationErrors: IQueryValidationResult[]
): Diagnostic[] => {
    return queryValidationErrors.map((validationError) => {
        const {
            start_line: line,
            start_ch: ch,
            end_line: endLine,
            end_ch: endCh,
            severity,
            message,
            suggestion,
        } = validationError;

        const startPos = posToOffset(editorView, {
            line,
            ch: ch + 1,
        });
        const endPos =
            endLine !== null && endCh !== null
                ? posToOffset(editorView, {
                      line: endLine,
                      ch: endCh + 1,
                  })
                : startPos + 1;

        return {
            from: startPos,
            to: endPos,
            severity: severity,
            message,
            renderMessage: getDiagnosticRenderer({
                from: startPos,
                to: endPos,
                message,
                suggestion,
            }),
        } as Diagnostic;
    });
};

const lintWarningsToDiagnostics = (
    view: EditorView,
    lintWarnings: ILinterWarning[]
): Diagnostic[] => {
    return lintWarnings.map(({ from, to, message, severity, suggestion }) => {
        const offsetFrom = posToOffset(view, from);
        const offsetTo = posToOffset(view, to);

        return {
            from: offsetFrom,
            to: offsetTo,
            message: message,
            severity: severity,
            renderMessage: getDiagnosticRenderer({
                from: offsetFrom,
                to: offsetTo,
                message,
                suggestion,
            }),
        };
    });
};

export interface ILintSummary {
    numErrors: number;
    numWarnings: number;
    failedToLint: boolean;
}

const useQueryLintDiagnostics = ({
    hasQueryLint,
    query,
    engineId,
    templatedVariables,
    editorView,
}: {
    hasQueryLint: boolean;
    query: string;
    engineId: number;
    templatedVariables: TDataDocMetaVariables;
    editorView: EditorView;
}) => {
    const [isLintingQuery, setIsLinting] = useState(false);
    const [failedToLint, setFailedToLint] = useState(false);
    const [queryDiagnostics, setQueryDiagnostics] = useState<Diagnostic[]>([]);
    const debouncedQuery = useDebounce(query, 1000);

    // use deep compare effect to avoid linting on every render when the templatedVariables are the same
    useDeepCompareEffect(() => {
        if (!editorView || !hasQueryLint || !debouncedQuery) {
            return;
        }
        setIsLinting(true);
        getQueryValidationErrors(query, engineId, templatedVariables)
            .then((validationErrors) =>
                queryValidationErrorsToDiagnostics(editorView, validationErrors)
            )
            .then((diagnostics) => {
                setQueryDiagnostics(diagnostics);
                setFailedToLint(false);
            })
            .catch((e) => {
                console.error('Linting error: ', e);
                setFailedToLint(true);
                setQueryDiagnostics([]);
            })
            .finally(() => {
                setIsLinting(false);
            });
    }, [editorView, debouncedQuery, templatedVariables, engineId]);

    return { isLintingQuery, queryDiagnostics, failedToLint };
};

const useTableLintDiagnostics = ({
    view,
    metastoreId,
    tableReferences,
    hasQueryLint,
}: {
    view: EditorView;
    metastoreId: number;
    tableReferences: TableToken[];
    hasQueryLint: boolean;
}) => {
    const [tableDiagnostics, setTableDiagnostics] = useState<Diagnostic[]>([]);

    const runLint = useCallback(() => {
        if (!view) {
            return [];
        }

        const contextSensitiveWarnings = getContextSensitiveWarnings(
            metastoreId,
            tableReferences,
            hasQueryLint
        );
        setTableDiagnostics(
            lintWarningsToDiagnostics(view, contextSensitiveWarnings)
        );
    }, [view, metastoreId, tableReferences, hasQueryLint]);

    useEffect(() => {
        runLint();
    }, [runLint]);

    return { tableDiagnostics, forceTableLint: runLint };
};

export const useLint = ({
    editorView,
    query,
    metastoreId,
    engineId,
    templatedVariables,
    tableReferences,
    hasQueryLint,
    onLintCompletion,
}: {
    editorView: EditorView;
    query: string;
    metastoreId: number;
    engineId: number;
    templatedVariables: TDataDocMetaVariables;
    tableReferences: TableToken[];
    hasQueryLint: boolean;
    onLintCompletion?: (hasError: boolean) => void;
}) => {
    const { isLintingQuery, queryDiagnostics, failedToLint } =
        useQueryLintDiagnostics({
            hasQueryLint,
            query,
            engineId,
            templatedVariables,
            editorView,
        });

    const { tableDiagnostics, forceTableLint } = useTableLintDiagnostics({
        view: editorView,
        metastoreId,
        tableReferences,
        hasQueryLint,
    });

    const lintDiagnostics = useMemo(
        () => [...tableDiagnostics, ...queryDiagnostics],
        [tableDiagnostics, queryDiagnostics]
    );

    const lintSummary: ILintSummary = useMemo(() => {
        let numErrors = 0;
        let numWarnings = 0;
        for (const diagnostic of lintDiagnostics) {
            if (diagnostic.severity === 'error') {
                numErrors++;
            } else if (diagnostic.severity === 'warning') {
                numWarnings++;
            }
        }
        return {
            numErrors,
            numWarnings,
            failedToLint,
        };
    }, [lintDiagnostics, failedToLint]);

    useEffect(() => {
        onLintCompletion?.(lintSummary.numErrors > 0);
    }, [lintSummary.numErrors, onLintCompletion]);

    return {
        isLinting: isLintingQuery,
        lintDiagnostics,
        lintSummary,
        forceTableLint,
    };
};
