import CodeMirror from 'codemirror';
import { TDataDocMetaVariables } from 'const/datadoc';

import type { ILinterWarning } from 'lib/sql-helper/sql-lexer';
import { TemplatedQueryResource } from 'resource/queryExecution';

export function createSQLLinter(
    engineId: number,
    templatedVariables: TDataDocMetaVariables
) {
    return async (query: string, cm: CodeMirror.Editor) => {
        const { data: validationResults } =
            await TemplatedQueryResource.validateQuery(
                query,
                engineId,
                templatedVariables
            );

        return validationResults.map((validationError) => {
            const {
                type,
                start_line: line,
                start_ch: ch,
                end_line: endLine,
                end_ch: endCh,
                severity,
                message,
                suggestion,
            } = validationError;

            const errorToken = cm.getTokenAt({
                line,
                // getTokenAt prioritizes tokens that end with ch range first
                ch: ch + 1,
            });

            if (errorToken) {
                return {
                    from: {
                        ch: errorToken.start,
                        line,
                    },
                    to: {
                        ch: endCh != null ? endCh + 1 : errorToken.end,
                        line: endLine ?? line,
                    },
                    severity,
                    message,
                    type,
                    suggestion,
                } as ILinterWarning;
            } else {
                return {
                    from: {
                        ch,
                        line,
                    },
                    to: {
                        ch: ch + 1,
                        line,
                    },
                    severity,
                    message,
                    type,
                    suggestion,
                } as ILinterWarning;
            }
        });
    };
}
