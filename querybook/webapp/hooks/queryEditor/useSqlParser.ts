import { useEffect, useMemo, useRef } from 'react';

import { ICodeAnalysis } from 'lib/sql-helper/sql-lexer';
import { SqlParser } from 'lib/sql-helper/sql-parser';

export function useSqlParser(
    metastoreId: number,
    language: string,
    codeAnalysis: ICodeAnalysis
) {
    const parserRef = useRef<SqlParser>();
    const parser = useMemo(() => {
        parserRef.current = new SqlParser(language, metastoreId);
        return parserRef.current;
    }, [language, metastoreId]);

    useEffect(() => {
        parser.codeAnalysis = codeAnalysis;
    }, [codeAnalysis, parser]);

    return parserRef;
}
