import { Diagnostic, linter, lintGutter } from '@codemirror/lint';
import { useMemo } from 'react';

export const useLintExtension = ({
    lintDiagnostics,
}: {
    lintDiagnostics: Diagnostic[];
}) => {
    const extension = useMemo(() => {
        return [
            lintGutter(),
            linter(() => lintDiagnostics, { autoPanel: false }),
        ];
    }, [lintDiagnostics]);

    return extension;
};
