import { useDebounce } from 'hooks/useDebounce';
import { ICodeAnalysis } from 'lib/sql-helper/sql-lexer';
import { useEffect, useRef, useState } from 'react';

import { analyzeCode } from 'lib/web-worker';

interface IUseCodeAnalysisParams {
    language: string;
    query: string;
    defaultSchema: string;
}

export function useCodeAnalysis({ language, query, defaultSchema }: IUseCodeAnalysisParams) {
    /**
     * the ref version is used to pass into functions in codemirror
     * this is to prevent unnecessary codemirror refreshes
     */
    const codeAnalysisRef = useRef<ICodeAnalysis>(null);
    const [codeAnalysis, setCodeAnalysis] = useState<ICodeAnalysis>(null);
    const debouncedQuery = useDebounce(query, 500);

    useEffect(() => {
        analyzeCode(debouncedQuery, 'autocomplete', language, defaultSchema).then(
            (codeAnalysis) => {
                codeAnalysisRef.current = codeAnalysis;
                setCodeAnalysis(codeAnalysis);
            }
        );
    }, [debouncedQuery, language, defaultSchema]);

    return { codeAnalysis, codeAnalysisRef };
}
