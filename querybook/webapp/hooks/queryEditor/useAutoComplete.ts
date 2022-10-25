import CodeMirror from 'lib/codemirror';
import { useMemo } from 'react';
import {
    AutoCompleteType,
    SqlAutoCompleter,
} from 'lib/sql-helper/sql-autocompleter';

export function useAutoComplete(
    metastoreId: number,
    autoCompleteType: AutoCompleteType,
    language: string
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

    return autoCompleter;
}
