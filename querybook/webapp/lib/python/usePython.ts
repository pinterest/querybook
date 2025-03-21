import { PythonContext } from './python-provider';
import { useCallback, useContext, useState } from 'react';

import {
    PythonExecutionStatus,
    PythonKernelStatus,
    PythonNamespaceInfo,
} from './types';

interface UsePythonProps {
    docId?: number;
    onStdout?: (message: string) => void;
    onStderr?: (message: string) => void;
    onComplete?: () => void;
}
interface UsePythonReturn {
    kernelStatus: PythonKernelStatus;
    runPython: (code: string) => Promise<void>;
    cancelRun: () => void;
    createDataFrame: (
        dfName: string,
        statementExecutionId: number,
        namespaceId?: number
    ) => Promise<void>;
    stdout: string[];
    stderr: string[];
    executionStatus: PythonExecutionStatus;
    executionCount: number;
    getNamespaceInfo: (namespaceId: number) => Promise<PythonNamespaceInfo>;
}

export default function usePython({
    docId,
    onStdout,
    onStderr,
}: UsePythonProps): UsePythonReturn {
    const [stdout, setStdout] = useState<string[]>([]);
    const [stderr, setStderr] = useState<string[]>([]);
    const [executionStatus, setExecutionStatus] =
        useState<PythonExecutionStatus>();
    const [executionCount, setExecutionCount] = useState<number>();

    const { status, runPython, cancelRun, createDataFrame, getNamespaceInfo } =
        useContext(PythonContext);

    const progressCallback = useCallback(
        (status, data) => {
            setExecutionStatus(status);
            setExecutionCount(data?.executionCount);
        },
        [setExecutionCount, setExecutionStatus]
    );

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

            // web worker will be blocked when running python code as it is single-threaded
            // so we need to set the status to pending from the main thread
            setExecutionStatus(PythonExecutionStatus.PENDING);

            await runPython(
                code,
                docId,
                progressCallback,
                stdoutCallback,
                stderrCallback
            );
        },
        [setStdout, setStdout, runPython, docId, stdoutCallback, stderrCallback]
    );

    return {
        kernelStatus: status,
        runPython: runPythonCode,
        cancelRun,
        createDataFrame,
        stdout,
        stderr,
        executionStatus,
        executionCount,
        getNamespaceInfo,
    };
}
