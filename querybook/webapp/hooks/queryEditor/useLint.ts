import { useDebounce } from 'hooks/useDebounce';
import CodeMirror from 'lib/codemirror';
import { getContextSensitiveWarnings } from 'lib/sql-helper/sql-context-sensitive-linter';
import {
    ICodeAnalysis,
    ILinterWarning,
    TableToken,
} from 'lib/sql-helper/sql-lexer';
import { isQueryUsingTemplating } from 'lib/templated-query/validation';
import { Nullable } from 'lib/typescript';
import React, { useCallback, useEffect, useRef, useState } from 'react';

function useTableLint(getTableByName: (schema: string, name: string) => any) {
    const tablesGettingLoadedRef = useRef<Set<string>>(new Set());
    const prefetchDataTables = useCallback(
        async (tableReferences: TableToken[]) => {
            if (!getTableByName) {
                return;
            }

            const tableLoadPromises = [];
            for (const { schema, name } of tableReferences) {
                const fullName = `${schema}.${name}`;
                if (!tablesGettingLoadedRef.current.has(fullName)) {
                    tableLoadPromises.push(getTableByName(schema, name));
                    tablesGettingLoadedRef.current.add(fullName);
                }
            }

            await Promise.all(tableLoadPromises);
        },
        [getTableByName]
    );

    const getTableLintAnnotations = useCallback(
        async (
            metastoreId: Nullable<number>,
            codeAnalysis: Nullable<ICodeAnalysis>,
            ignoreTableExists: boolean
        ) => {
            if (!metastoreId || !codeAnalysis) {
                return [];
            }
            const tableReferences = [].concat.apply(
                [],
                Object.values(codeAnalysis.lineage.references)
            );
            await prefetchDataTables(tableReferences);

            const contextSensitiveWarnings = getContextSensitiveWarnings(
                metastoreId,
                tableReferences,
                ignoreTableExists
            );
            return contextSensitiveWarnings;
        },
        [prefetchDataTables]
    );

    return getTableLintAnnotations;
}

interface IUseLintParams {
    query: string;

    editorRef: React.MutableRefObject<CodeMirror.Editor>;
    metastoreId: Nullable<number>;
    codeAnalysisRef: React.MutableRefObject<Nullable<ICodeAnalysis>>;
    getTableByName: (schema: string, name: string) => any;
    getLintErrors: Nullable<
        (query: string, editor: CodeMirror.Editor) => Promise<ILinterWarning[]>
    >;

    onLintCompletion: Nullable<(hasError: boolean) => void>;
}

export function useLint({
    query,

    editorRef,
    metastoreId,
    codeAnalysisRef,
    getTableByName,
    getLintErrors,
    onLintCompletion,
}: IUseLintParams) {
    const [isLinting, setIsLinting] = useState(false);
    const [lintSummary, setLintSummary] = useState(() => ({
        numWarnings: 0,
        numErrors: 0,
    }));

    const lintAnnotationsRef = useRef<ILinterWarning[]>([]);
    const debouncedQuery = useDebounce(query, 1000);

    const getTableLintAnnotations = useTableLint(getTableByName);
    const getQueryLintAnnotations = useCallback(
        async (code: string) => {
            if (
                !getLintErrors ||
                code.length === 0 ||
                isQueryUsingTemplating(code)
            ) {
                return [];
            }

            const warnings = await getLintErrors(code, editorRef.current);
            return warnings;
        },
        [editorRef, getLintErrors]
    );

    const getCodeMirrorLintAnnotations = useCallback(
        (
            _code: string,
            onComplete: (warnings: ILinterWarning[]) => void,
            _options: any,
            _editor: CodeMirror.Editor
        ) => {
            onComplete(lintAnnotationsRef.current);
        },
        []
    );

    useEffect(() => {
        setIsLinting(true);
        Promise.all([
            getTableLintAnnotations(
                metastoreId,
                codeAnalysisRef.current,
                !!getLintErrors
            ),
            getQueryLintAnnotations(query),
        ])
            .then(([tableAnnotations, lintAnnotations]) => {
                const annotations = tableAnnotations.concat(lintAnnotations);
                lintAnnotationsRef.current = annotations;

                let numErrors = 0;
                let numWarnings = 0;
                for (const annotation of annotations) {
                    if (annotation.severity === 'error') {
                        numErrors++;
                    } else if (annotation.severity === 'warning') {
                        numWarnings++;
                    }
                }
                setLintSummary({
                    numErrors,
                    numWarnings,
                });
                onLintCompletion?.(numErrors > 0);

                editorRef.current?.performLint?.();
            })
            .finally(() => {
                setIsLinting(false);
            });
        // to speed up, we only need the following deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQuery, getLintErrors]);

    return {
        getLintAnnotations: getCodeMirrorLintAnnotations,
        isLinting,
        lintSummary,
    };
}
