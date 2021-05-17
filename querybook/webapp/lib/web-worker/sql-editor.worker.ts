import {
    ICodeAnalysis,
    tokenize,
    simpleParse,
    findTableReferenceAndAlias,
    getEditorLines,
} from 'lib/sql-helper/sql-lexer';
import { getContextFreeLinterWarnings } from 'lib/sql-helper/sql-context-free-linter';

const context: Worker = self as any;
context.addEventListener(
    'message',
    (e) => {
        const { id, mode, code, language } = e.data;
        const tokens = tokenize(code, language);
        const statements = simpleParse(tokens);

        const codeAnalysis: ICodeAnalysis = {
            lineage: findTableReferenceAndAlias(statements),
        };

        if (mode === 'autocomplete') {
            codeAnalysis.editorLines = getEditorLines(statements);
        } else if (mode === 'lint') {
            codeAnalysis.contextFreeLinterWarnings = getContextFreeLinterWarnings(
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
