import { useDebounce } from 'hooks/useDebounce';
import { ICodeAnalysis } from 'lib/sql-helper/sql-lexer';
import CodeMirror from 'lib/codemirror';
import { useEffect, useMemo, useRef } from 'react';
import {
    AutoCompleteType,
    SqlAutoCompleter,
} from 'lib/sql-helper/sql-autocompleter';
import { analyzeCode } from 'lib/web-worker';

export function useAutoComplete(
    metastoreId: number,
    autoCompleteType: AutoCompleteType,
    language: string,
    query: string
) {
    const codeAnalysisRef = useRef<ICodeAnalysis>(null);
    const autoCompleter = useMemo(
        () =>
            new SqlAutoCompleter(
                CodeMirror,
                language,
                metastoreId,
                autoCompleteType
            ),
        [language, metastoreId, autoCompleteType]
    );

    const debouncedQuery = useDebounce(query, 500);

    useEffect(() => {
        analyzeCode(debouncedQuery, 'autocomplete', language).then(
            (codeAnalysis) => {
                codeAnalysisRef.current = codeAnalysis;
                autoCompleter.updateCodeAnalysis(codeAnalysis);
            }
        );
    }, [debouncedQuery, language, autoCompleter]);

    return {
        codeAnalysisRef,
        autoCompleter,
    };
}
