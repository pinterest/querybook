import { useEffect, useRef, useState } from 'react';

import { useDebounce } from 'hooks/useDebounce';
import { ICodeAnalysis } from 'lib/sql-helper/sql-lexer';
import { analyzeCode } from 'lib/web-worker';

interface IUseCodeAnalysisParams {
    language: string;
    query: string;
}

export function useCodeAnalysis({ language, query }: IUseCodeAnalysisParams) {
    /**
     * the ref version is used to pass into functions in codemirror
     * this is to prevent unnecessary codemirror refreshes
     */
    const codeAnalysisRef = useRef<ICodeAnalysis>(null);
    const [codeAnalysis, setCodeAnalysis] = useState<ICodeAnalysis>(null);
    const debouncedQuery = useDebounce(query, 500);

    useEffect(() => {
        analyzeCode(debouncedQuery, 'autocomplete', language).then(
            (codeAnalysis) => {
                codeAnalysisRef.current = codeAnalysis;
                setCodeAnalysis(codeAnalysis);
            }
        );
    }, [debouncedQuery, language]);

    return { codeAnalysisRef, codeAnalysis };
}
