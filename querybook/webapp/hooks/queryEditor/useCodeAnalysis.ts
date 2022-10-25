import { useDebounce } from 'hooks/useDebounce';
import { ICodeAnalysis } from 'lib/sql-helper/sql-lexer';
import { useEffect, useRef } from 'react';

import { analyzeCode } from 'lib/web-worker';

interface IUseCodeAnalysisParams {
    onAnalyzed?: (codeAnalysis: ICodeAnalysis) => void;
    language: string;
    query: string;
}

export function useCodeAnalysis({
    onAnalyzed,
    language,
    query,
}: IUseCodeAnalysisParams) {
    const codeAnalysisRef = useRef<ICodeAnalysis>(null);
    const debouncedQuery = useDebounce(query, 500);

    useEffect(() => {
        analyzeCode(debouncedQuery, 'autocomplete', language).then(
            (codeAnalysis) => {
                codeAnalysisRef.current = codeAnalysis;
                onAnalyzed?.(codeAnalysis);
            }
        );
    }, [debouncedQuery, language, onAnalyzed]);

    return codeAnalysisRef;
}
