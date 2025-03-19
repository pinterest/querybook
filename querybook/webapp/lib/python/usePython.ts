import { PythonContext } from './python-provider';
import { useCallback, useContext, useState } from 'react';

import { PythonKernelStatus } from './types';

interface UsePythonProps {
    docId?: number;
    onStdout?: (message: string) => void;
    onStderr?: (message: string) => void;
    onComplete?: () => void;
}
interface UsePythonReturn {
    kernelStatus: PythonKernelStatus;
    runPython: (code: string) => Promise<void>;
    createDataFrame: (
        dfName: string,
        statementExecutionId: number,
        namespaceId?: number
    ) => Promise<void>;
    stdout: string[];
    stderr: string[];
    getExecutionCount: (namespaceId: number) => Promise<number>;
}

export default function usePython({
    docId,
    onStdout,
    onStderr,
}: UsePythonProps): UsePythonReturn {
    const [stdout, setStdout] = useState<string[]>([]);
    const [stderr, setStderr] = useState<string[]>([]);

    const { status, getExecutionCount, runPython, createDataFrame } =
        useContext(PythonContext);

    const stdoutCallback = useCallback(
        (msg: string) => {
            try {
                const parsed = JSON.parse(msg);
                if (
                    typeof parsed === 'object' &&
                    ['dataframe', 'image', 'json'].includes(parsed.type)
                ) {
                    setStdout((prev) => [...prev, parsed]);
                } else {
                    setStdout((prev) => [...prev, msg]);
                }
            } catch (error) {
                // Not JSON, treat as plain text
                setStdout((prev) => [...prev, msg]);
            }

            // Call custom handler if provided
            if (onStdout) {
                onStdout(msg);
            }
        },
        [onStdout]
    );

    const stderrCallback = useCallback(
        (msg: string) => {
            setStderr((prev) => [...prev, msg]);

            // Call custom handler if provided
            if (onStderr) {
                onStderr(msg);
            }
        },
        [onStderr]
    );

    const runPythonCode = useCallback(
        async (code: string) => {
            setStdout([]);
            setStderr([]);

            await runPython(code, docId, stdoutCallback, stderrCallback);
        },
        [setStdout, setStdout, runPython, docId, stdoutCallback, stderrCallback]
    );

    return {
        kernelStatus: status,
        runPython: runPythonCode,
        createDataFrame,
        stdout,
        stderr,
        getExecutionCount,
    };
}
