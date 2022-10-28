import CodeMirror from 'lib/codemirror';
import { useEffect, useMemo } from 'react';
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

    useEffect(() => {
        autoCompleter.updateCodeAnalysis(codeAnalysis);
    }, [codeAnalysis, autoCompleter]);

    return autoCompleter;
}
