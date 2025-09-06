import { PythonContext } from './python-provider';
import { debounce } from 'lodash';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { PythonCellResource } from 'resource/pythonCell';

import {
    PythonExecutionStatus,
    PythonKernelStatus,
    PythonNamespaceInfo,
    PythonOutputType,
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
    stdout: PythonOutputType[];
    stderr: string | null;
    executionStatus: PythonExecutionStatus;
    executionCount: number;
    getNamespaceInfo: (namespaceId: number) => Promise<PythonNamespaceInfo>;
    injectVariables: (variables: Record<string, any>) => void;
}

export default function usePython({
    docId,
    cellId,
    onStdout,
    onStderr,
}: UsePythonProps): UsePythonReturn {
    const [stdout, setStdout] = useState<PythonOutputType[]>([]);
    const [stderr, setStderr] = useState<string>();
    const [executionStatus, setExecutionStatus] =
        useState<PythonExecutionStatus>();
    const [executionCount, setExecutionCount] = useState<number>();

    const { kernelStatus, runPython, getNamespaceInfo, injectVariables } =
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
        (
            status: PythonExecutionStatus,
            data?: {
                executionCount?: number;
            }
        ) => {
            setExecutionStatus(status);
            setExecutionCount(data?.executionCount);
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

    const injectVariablesForDoc = useCallback(
        async (variables: Record<string, any>) => {
            if (docId !== undefined) {
                await injectVariables(docId, variables);
            }
        },
        [docId, injectVariables]
    );

    return {
        kernelStatus,
        runPython: runPythonCode,
        stdout,
        stderr,
        executionStatus,
        executionCount,
        getNamespaceInfo,
        injectVariables: injectVariablesForDoc,
    };
}
