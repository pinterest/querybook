import { PythonContext } from './python-provider';
import { debounce } from 'lodash';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { PythonCellResource } from 'resource/pythonCell';

import {
    PythonExecutionStatus,
    PythonKernelStatus,
    PythonNamespaceInfo,
} from './types';

interface UsePythonProps {
    docId?: number;
    cellId?: number;
    onStdout?: (message: string) => void;
    onStderr?: (message: string) => void;
    onComplete?: () => void;
}
interface UsePythonReturn {
    kernelStatus: PythonKernelStatus;
    runPython: (code: string) => Promise<void>;
    cancelRun: () => Promise<void>;
    createDataFrame: (
        dfName: string,
        statementExecutionId: number,
        namespaceId?: number
    ) => Promise<void>;
    stdout: string[];
    stderr: string | null;
    executionStatus: PythonExecutionStatus;
    executionCount: number;
    getNamespaceInfo: (namespaceId: number) => Promise<PythonNamespaceInfo>;
}

export default function usePython({
    docId,
    cellId,
    onStdout,
    onStderr,
}: UsePythonProps): UsePythonReturn {
    const [stdout, setStdout] = useState<string[]>([]);
    const [stderr, setStderr] = useState<string>();
    const [executionStatus, setExecutionStatus] =
        useState<PythonExecutionStatus>();
    const [executionCount, setExecutionCount] = useState<number>();
    const cancelPromiseResolveRef = useRef<() => void>(null);

    const { status, runPython, cancelRun, createDataFrame, getNamespaceInfo } =
        useContext(PythonContext);

    useEffect(() => {
        if (cellId) {
            PythonCellResource.getResult(cellId).then((resp) => {
                const result = resp.data;
                if (result) {
                    setStdout(result.output);
                    setStderr(result.error);
                }
            });
        }
    }, []);

    const debouncedUpdateResult = useCallback(
        debounce(
            (cellId, stdout, stderr) =>
                PythonCellResource.updateResult(cellId, stdout, stderr),
            1000
        ),
        []
    );

    useEffect(() => {
        if (
            cellId &&
            (executionStatus === PythonExecutionStatus.SUCCESS ||
                executionStatus === PythonExecutionStatus.ERROR ||
                executionStatus === PythonExecutionStatus.CANCEL)
        ) {
            debouncedUpdateResult(cellId, stdout, stderr);
        }
    }, [executionStatus, stdout, stderr]);

    const progressCallback = useCallback(
        (status, data) => {
            setExecutionStatus(status);
            setExecutionCount(data?.executionCount);

            if (
                cancelPromiseResolveRef.current &&
                status === PythonExecutionStatus.CANCEL
            ) {
                cancelPromiseResolveRef.current();
                cancelPromiseResolveRef.current = null;
            }
        },
        [setExecutionCount, setExecutionStatus]
    );

    const stdoutCallback = useCallback(
        (text: string) => {
            try {
                const parsed = JSON.parse(text);
                if (
                    typeof parsed === 'object' &&
                    ['dataframe', 'image', 'json'].includes(parsed.type)
                ) {
                    setStdout((prev) => [...prev, parsed]);
                } else {
                    setStdout((prev) => [...prev, text]);
                }
            } catch (error) {
                // Not JSON, treat as plain text
                setStdout((prev) => [...prev, text]);
            }

            // Call custom handler if provided
            if (onStdout) {
                onStdout(text);
            }
        },
        [onStdout]
    );

    const stderrCallback = useCallback(
        (text: string) => {
            setStderr(text);

            // Call custom handler if provided
            if (onStderr) {
                onStderr(text);
            }
        },
        [onStderr]
    );

    const runPythonCode = useCallback(
        async (code: string) => {
            setStdout([]);
            setStderr(null);

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

    const cancelRunPython = useCallback((): Promise<void> => {
        return new Promise((resolve) => {
            cancelRun();
            cancelPromiseResolveRef.current = resolve;
        });
    }, [cancelRun]);

    return {
        kernelStatus: status,
        runPython: runPythonCode,
        cancelRun: cancelRunPython,
        createDataFrame,
        stdout,
        stderr,
        executionStatus,
        executionCount,
        getNamespaceInfo,
    };
}
