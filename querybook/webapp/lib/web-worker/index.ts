import { uniqueId } from 'lodash';

import { ICodeAnalysis } from 'lib/sql-helper/sql-lexer';

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
        sqlEditorWorker = new Worker(
            new URL('./sql-editor.worker.ts', import.meta.url)
        );
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
