import { getContextFreeLinterWarnings } from 'lib/sql-helper/sql-context-free-linter';
import {
    findTableReferenceAndAlias,
    getEditorLines,
    ICodeAnalysis,
    simpleParse,
    tokenize,
} from 'lib/sql-helper/sql-lexer';

const context: Worker = self as any;
context.addEventListener(
    'message',
    (e) => {
        const { id, mode, code, language } = e.data;
        const tokens = tokenize(code, { language });
        const statements = simpleParse(tokens);

        //  The codeAnalysis contains a list of references to tables
        //  and of table aliases. It is used for downstream linters which need
        //  to know which  tables are being accessed in a query
        const codeAnalysis: ICodeAnalysis = {
            lineage: findTableReferenceAndAlias(statements),
        };

        if (mode === 'autocomplete') {
            codeAnalysis.editorLines = getEditorLines(statements);
        } else if (mode === 'lint') {
            codeAnalysis.contextFreeLinterWarnings =
                getContextFreeLinterWarnings(
                    statements,
                    language,
                    codeAnalysis
                );
        }

        context.postMessage(
            JSON.stringify({
                id,
                codeAnalysis,
            })
        );
    },
    false
);
