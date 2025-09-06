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
    PythonExecutionStatus,
    PythonKernel,
    PythonKernelStatus,
    PythonNamespaceInfo,
} from './types';

export interface PythonContextType {
    kernelStatus: PythonKernelStatus;
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
    getNamespaceInfo: (namespaceId: number) => Promise<PythonNamespaceInfo>;
    injectVariables: (
        namespaceId: number,
        variables: Record<string, any>
    ) => Promise<void>;
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

    // Add a ref to track the number of running tasks
    const taskCounterRef = useRef(0);

    /**
     * Helper to update kernel status based on task counter
     */
    const updateKernelStatus = useCallback(() => {
        if (
            status === PythonKernelStatus.UNINITIALIZED ||
            status === PythonKernelStatus.INITIALIZING ||
            status === PythonKernelStatus.FAILED
        ) {
            // Don't override these states
            return;
        }
        if (taskCounterRef.current > 0) {
            setStatus(PythonKernelStatus.BUSY);
        } else {
            setStatus(PythonKernelStatus.IDLE);
        }
    }, [status, setStatus]);

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
        taskCounterRef.current = 0;
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
            setStatus(PythonKernelStatus.IDLE);
        } catch (error) {
            console.error('Error initializing Python kernel:', error);
            setStatus(PythonKernelStatus.FAILED);
            terminateKernel();
        }
    }, [status, setStatus, terminateKernel]);

    useEffect(() => {
        // cleanup on unmount
        return () => {
            terminateKernel();
        };
    }, []);

    useEffect(() => {
        if (!kernelRef.current || !currentEnvironment) {
            return;
        }
        kernelRef.current.setEnvironment(currentEnvironment.name);
    }, [kernelRef.current, currentEnvironment]);

    /**
     * Run Python code in the specified namespace
     *
     * For running cancellation, it needs to use SharedArrayBuffer.
     * SharedArrayBuffer requires isolated cross-origin access,
     * which will block cross-origin resources from being loaded.
     * So we haven't enabled this feature yet.
     *
     * For more details, refer to https://pyodide.org/en/stable/usage/keyboard-interrupts.html
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
            // Initialize kernel if not already initialized
            if (!kernelRef.current) {
                await initKernel();
                if (!kernelRef.current) {
                    stderrCallback?.('Failed to initialize Python kernel');
                    return;
                }
            }

            // Increment task counter and update status
            taskCounterRef.current += 1;
            updateKernelStatus();

            try {
                // Run the code with specific callbacks for this execution
                await kernelRef.current.runPython(
                    code,
                    namespaceId,
                    proxy(progressCallback),
                    proxy(stdoutCallback),
                    proxy(stderrCallback)
                );
            } finally {
                // Decrement task counter and update status
                taskCounterRef.current -= 1;
                updateKernelStatus();
            }
        },
        [initKernel, setStatus, updateKernelStatus]
    );

    const getNamespaceInfo = useCallback(
        async (namespaceId: number): Promise<PythonNamespaceInfo> => {
            if (!kernelRef.current) {
                await initKernel();
                if (!kernelRef.current) {
                    return;
                }
            }

            const info = await kernelRef.current.getNamespaceInfo(namespaceId);
            return JSON.parse(info);
        },
        [initKernel]
    );

    const injectVariables = useCallback(
        async (
            namespaceId: number,
            variables: Record<string, any>
        ): Promise<void> => {
            if (!kernelRef.current) {
                await initKernel();
                if (!kernelRef.current) {
                    return;
                }
            }

            await kernelRef.current.injectVariables(namespaceId, variables);
        },
        [initKernel]
    );

    return (
        <PythonContext.Provider
            value={{
                kernelStatus: status,
                runPython,
                getNamespaceInfo,
                injectVariables,
            }}
        >
            {children}
        </PythonContext.Provider>
    );
}

export { PythonContext, PythonProvider };
