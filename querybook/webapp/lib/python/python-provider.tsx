import { proxy, releaseProxy, Remote, wrap } from 'comlink';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useSelector } from 'react-redux';

import { currentEnvironmentSelector } from 'redux/environment/selector';

import {
    InterruptBufferStatus,
    PythonExecutionStatus,
    PythonKernel,
    PythonKernelStatus,
    PythonNamespaceInfo,
} from './types';

export interface PythonContextType {
    status: PythonKernelStatus;
    runPython: (
        code: string,
        namespaceId?: number,
        progressCallback?: (
            status: PythonExecutionStatus,
            data?: {
                executionCount?: number;
            }
        ) => void,
        stdoutCallback?: (text: string) => void,
        stderrCallback?: (text: string) => void
    ) => Promise<void>;
    cancelRun: () => void;
    createDataFrame: (
        dfName: string,
        statementExecutionId: number,
        namespaceId?: number
    ) => Promise<void>;
    getNamespaceInfo: (namespaceId: number) => Promise<PythonNamespaceInfo>;
}

const PythonContext = createContext<PythonContextType>(null);

interface PythonProviderProps {
    children: ReactNode;
}

function PythonProvider({ children }: PythonProviderProps) {
    const [status, setStatus] = useState(PythonKernelStatus.UNINITIALIZED);
    const workerRef = useRef<Worker>(null);
    const kernelRef = useRef<Remote<PythonKernel>>(null);
    const sharedInterruptBuffer = useRef<Uint8Array>(null);
    const currentEnvironment = useSelector(currentEnvironmentSelector);

    /**
     * Terminate the kernel and clean up resources
     */
    const terminateKernel = useCallback(() => {
        // Terminate worker
        if (workerRef.current) {
            workerRef.current.terminate();
            workerRef.current = null;
        }

        // Release kernel proxy
        if (kernelRef.current) {
            kernelRef.current[releaseProxy]();
            kernelRef.current = null;
        }

        // Reset state
        setStatus(PythonKernelStatus.UNINITIALIZED);
    }, [setStatus]);

    const initKernel = useCallback(async () => {
        // Don't initialize if already initializing or initialized
        if (status !== PythonKernelStatus.UNINITIALIZED) {
            return;
        }

        try {
            setStatus(PythonKernelStatus.INITIALIZING);

            // Create a new worker
            const worker = new Worker(
                new URL('./python-worker', import.meta.url),
                {
                    name: 'python-worker',
                    type: 'module',
                }
            );
            workerRef.current = worker;

            // Wrap the worker with comlink
            const kernel: Remote<PythonKernel> = wrap(worker);
            await kernel.initialize();

            kernelRef.current = kernel;
            const sharedBuffer = await kernel.interruptBuffer;
            sharedInterruptBuffer.current = sharedBuffer;

            setStatus(PythonKernelStatus.IDLE);
        } catch (error) {
            console.error('Error initializing Python kernel:', error);
            setStatus(PythonKernelStatus.FAILED);
            terminateKernel();
        }
    }, [status, setStatus, terminateKernel]);

    useEffect(() => {
        initKernel();

        // cleanup on unmount
        return () => {
            terminateKernel();
        };
    }, []);

    useEffect(() => {
        if (!kernelRef.current) {
            return;
        }
        kernelRef.current.setEnvironment(currentEnvironment.name);
    }, [kernelRef.current, currentEnvironment]);

    /**
     * Run Python code in the specified namespace
     */
    const runPython = useCallback(
        async (
            code: string,
            namespaceId?: number,
            progressCallback?: (
                status: PythonExecutionStatus,
                data?: {
                    executionCount?: number;
                }
            ) => void,
            stdoutCallback?: (text: string) => void,
            stderrCallback?: (text: string) => void
        ) => {
            // Kernel is supposed to be initialized
            if (!kernelRef.current) {
                stderrCallback('Python kernel has not been initialized');
                return;
            }

            // Update status to reflect that we're about to run code
            setStatus(PythonKernelStatus.BUSY);

            // Run the code with specific callbacks for this execution
            await kernelRef.current.runPython(
                code,
                namespaceId,
                proxy(progressCallback),
                proxy(stdoutCallback),
                proxy(stderrCallback)
            );
            setStatus(PythonKernelStatus.IDLE);
        },
        [initKernel, setStatus]
    );

    /**
     * Interrupting a running code execution is achieved using a shared buffer.
     * This operation must be performed on the main thread.
     * For more details, refer to https://pyodide.org/en/stable/usage/keyboard-interrupts.html
     */
    const cancelRun = useCallback(() => {
        if (sharedInterruptBuffer.current) {
            sharedInterruptBuffer.current[0] = InterruptBufferStatus.SIGINT;
        }
    }, []);

    const getNamespaceInfo = useCallback(
        async (namespaceId: number): Promise<PythonNamespaceInfo> => {
            if (!kernelRef.current) {
                return;
            }

            const info = await kernelRef.current.getNamespaceInfo(namespaceId);
            return JSON.parse(info);
        },
        []
    );

    return (
        <PythonContext.Provider
            value={{
                status,
                runPython,
                cancelRun,
                createDataFrame: kernelRef.current?.createDataFrame,
                getNamespaceInfo,
            }}
        >
            {children}
        </PythonContext.Provider>
    );
}

export { PythonContext, PythonProvider };
