import CodeMirror from 'lib/codemirror';
import { useEffect, useMemo, useRef } from 'react';
import {
    AutoCompleteType,
    SqlAutoCompleter,
} from 'lib/sql-helper/sql-autocompleter';
import { ICodeAnalysis } from 'lib/sql-helper/sql-lexer';

export function useAutoComplete(
    metastoreId: number,
    autoCompleteType: AutoCompleteType,
    language: string,
    codeAnalysis: ICodeAnalysis
) {
    const autoCompleterRef = useRef<SqlAutoCompleter>();
    const autoCompleter = useMemo(() => {
        const completer = new SqlAutoCompleter(
            CodeMirror,
            language,
            metastoreId,
            autoCompleteType
        );
        autoCompleterRef.current = completer;
        return completer;
    }, [language, metastoreId, autoCompleteType]);

    useEffect(() => {
        autoCompleter.updateCodeAnalysis(codeAnalysis);
    }, [codeAnalysis, autoCompleter]);

    return autoCompleterRef;
}
