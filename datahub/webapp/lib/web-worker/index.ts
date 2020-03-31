import { uniqueId, debounce } from 'lodash';
import { ICodeAnalysis } from 'lib/sql-helper/sql-lexer';
import { getContextSensitiveWarnings } from 'lib/sql-helper/sql-context-sensitive-linter';

const SqlEditorWorker = require('worker-loader!./sql-editor-worker.ts');

const onCompletePromisesById: Record<number, (value?: any) => void> = {};
let sqlEditorWorker = null;
/*
 *   @code {string} sql code we are parsing
 *   @code {string} mode analysis we are looking for, can either autocomplete or lint
 */
export function analyzeCode(
    code: string,
    mode = 'autocomplete',
    language = 'hive'
): Promise<ICodeAnalysis> {
    if (!sqlEditorWorker) {
        sqlEditorWorker = new SqlEditorWorker();
        sqlEditorWorker.addEventListener(
            'message',
            (response) => {
                const { id, codeAnalysis } = JSON.parse(response.data);

                if (id in onCompletePromisesById) {
                    onCompletePromisesById[id](codeAnalysis);
                    delete onCompletePromisesById[id];
                }
            },
            false
        );
    }

    return new Promise((resolve, reject) => {
        const id = uniqueId('req');
        onCompletePromisesById[id] = resolve;

        sqlEditorWorker.postMessage({
            code,
            mode,
            id,
            language,
        });
    });
}

/*
    This debounce method is only needed because for some strange reason
    getSqlLintAnnotations gets called twice, added debouce to make sure
    only 1 gets ran
*/
const getSqlLintAnnotationsDebounced = debounce(
    (metastoreId, text, language, onComplete) => {
        analyzeCode(text, 'lint', language).then(
            async (codeAnalysis: ICodeAnalysis) => {
                const {
                    contextFreeLinterWarnings = [],
                    lineage = {
                        references: {},
                        aliases: {},
                    },
                } = codeAnalysis;

                const contextSensitiveWarnings = await getContextSensitiveWarnings(
                    metastoreId,
                    lineage
                );
                onComplete(
                    contextFreeLinterWarnings.concat(contextSensitiveWarnings)
                );
            }
        );
    },
    50
);

export const getSqlLintAnnotations = (
    metastoreId: number,
    language: string
) => (text: string, onComplete: () => any) => {
    if ((text || '').length === 0) {
        return;
    }
    getSqlLintAnnotationsDebounced(metastoreId, text, language, onComplete);
};
