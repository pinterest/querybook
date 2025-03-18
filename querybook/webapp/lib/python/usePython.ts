import { PythonContext } from './python-provider';
import { useCallback, useContext, useState } from 'react';

interface UsePythonProps {
    docId?: number;
    onStdout?: (message: string) => void;
    onStderr?: (message: string) => void;
    onComplete?: () => void;
}

export default function usePython({
    docId,
    onStdout,
    onStderr,
}: UsePythonProps) {
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
        [runPython]
    );

    /**
     * Export query results to Python as a DataFrame
     */
    const exportQueryResult = useCallback(
        async (dataframeName, statementResultData) => {
            const header = statementResultData[0];
            const records = statementResultData.slice(1);
            await createDataFrame(dataframeName, records, header, docId);
        },
        [createDataFrame, docId]
    );

    return {
        kernelStatus: status,
        runPython: runPythonCode,
        exportQueryResult,
        stdout,
        stderr,
        getExecutionCount,
    };
}
