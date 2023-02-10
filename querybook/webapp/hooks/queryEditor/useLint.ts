import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { useDebounce } from 'hooks/useDebounce';
import CodeMirror from 'lib/codemirror';
import { getContextSensitiveWarnings } from 'lib/sql-helper/sql-context-sensitive-linter';
import {
    ICodeAnalysis,
    ILinterWarning,
    TableToken,
} from 'lib/sql-helper/sql-lexer';
import { Nullable } from 'lib/typescript';

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

function useQueryLintAnnotations(
    query: string,
    getLintErrors: Nullable<
        (query: string, editor: CodeMirror.Editor) => Promise<ILinterWarning[]>
    >,
    editorRef: React.MutableRefObject<CodeMirror.Editor>
) {
    const [isLintingQuery, setIsLinting] = useState(false);
    const [queryAnnotations, setQueryAnnotations] = useState<ILinterWarning[]>(
        []
    );
    const debouncedQuery = useDebounce(query, 1000);

    const getQueryLintAnnotations = useCallback(
        async (code: string) => {
            if (!getLintErrors || code.length === 0) {
                return [];
            }

            const warnings = await getLintErrors(code, editorRef.current);
            return warnings;
        },
        [editorRef, getLintErrors]
    );

    useEffect(() => {
        setIsLinting(true);
        getQueryLintAnnotations(query)
            .then(setQueryAnnotations)
            .finally(() => {
                setIsLinting(false);
            });

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedQuery, getQueryLintAnnotations]);

    return { isLintingQuery, queryAnnotations };
}

function useTableLintAnnotations(
    metastoreId: Nullable<number>,
    codeAnalysis: Nullable<ICodeAnalysis>,
    getTableByName: (schema: string, name: string) => any,
    hasQueryLint: boolean
) {
    const [isLintingTable, setIsLinting] = useState(false);
    const [tableAnnotations, setTableAnnotations] = useState<ILinterWarning[]>(
        []
    );
    const getTableLintAnnotations = useTableLint(getTableByName);

    useEffect(() => {
        setIsLinting(true);
        getTableLintAnnotations(metastoreId, codeAnalysis, hasQueryLint)
            .then(setTableAnnotations)
            .finally(() => {
                setIsLinting(false);
            });
    }, [metastoreId, codeAnalysis, hasQueryLint, getTableLintAnnotations]);

    return { isLintingTable, tableAnnotations };
}

interface IUseLintParams {
    query: string;

    editorRef: React.MutableRefObject<CodeMirror.Editor>;
    metastoreId: Nullable<number>;
    codeAnalysis: Nullable<ICodeAnalysis>;
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
    codeAnalysis,
    getTableByName,
    getLintErrors,
    onLintCompletion,
}: IUseLintParams) {
    const { isLintingTable, tableAnnotations } = useTableLintAnnotations(
        metastoreId,
        codeAnalysis,
        getTableByName,
        !!getLintErrors
    );
    const { isLintingQuery, queryAnnotations } = useQueryLintAnnotations(
        query,
        getLintErrors,
        editorRef
    );
    const lintAnnotationsRef = useRef<ILinterWarning[]>([]);
    const lintAnnotations = useMemo(
        () =>
            tableAnnotations.concat(
                queryAnnotations.filter(
                    (obj: ILinterWarning) => obj.type === 'lint'
                )
            ),
        [tableAnnotations, queryAnnotations]
    );

    useEffect(() => {
        lintAnnotationsRef.current = lintAnnotations;
        editorRef.current?.performLint?.();
    }, [editorRef, onLintCompletion, lintAnnotations]);

    const lintSummary = useMemo(() => {
        let numErrors = 0;
        let numWarnings = 0;
        for (const annotation of lintAnnotations) {
            if (annotation.severity === 'error') {
                numErrors++;
            } else if (annotation.severity === 'warning') {
                numWarnings++;
            }
        }
        return {
            numErrors,
            numWarnings,
        };
    }, [lintAnnotations]);

    useEffect(() => {
        onLintCompletion?.(lintSummary.numErrors > 0);
    }, [lintSummary.numErrors, onLintCompletion]);

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

    return {
        getLintAnnotations: getCodeMirrorLintAnnotations,
        isLinting: isLintingQuery || isLintingTable,
        lintSummary,
        queryAnnotations,
    };
}
