import { proxy, releaseProxy, Remote, wrap } from 'comlink';
import React, {
    createContext,
    ReactNode,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import { PythonKernel, PythonKernelStatus } from './types';

export interface PythonContextType {
    status: PythonKernelStatus;
    runPython: (
        code: string,
        namespaceId?: number,
        stdoutCallback?: (text: string) => void,
        stderrCallback?: (text: string) => void
    ) => Promise<void>;
    getExecutionCount: (namespaceId: number) => Promise<number>;
    createDataFrame: (
        dfName: string,
        statementExecutionId: number,
        namespaceId?: number
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

            setStatus(PythonKernelStatus.IDLE);
        } catch (error) {
            console.error('Error initializing Python kernel:', error);
            setStatus(PythonKernelStatus.FAILED);
            terminateKernel();
        }
    }, [setStatus, terminateKernel]);

    useEffect(() => {
        initKernel();

        // cleanup on unmount
        return () => {
            terminateKernel();
        };
    }, []);

    /**
     * Get the execution count for a namespace from the kernel
     */
    const getExecutionCount = useCallback(async (namespaceId: number) => {
        if (!kernelRef.current) {
            return 0;
        }
        return kernelRef.current.getExecutionCount(namespaceId);
    }, []);

    /**
     * Run Python code in the specified namespace
     */
    const runPython = useCallback(
        async (
            code: string,
            namespaceId?: number,
            stdoutCallback?: (text: string) => void,
            stderrCallback?: (text: string) => void
        ) => {
            // Kernel is supposed to be initialized
            if (!kernelRef.current) {
                stderrCallback('Python kernel has not been initialized');
                return;
            }

            try {
                // Update status to reflect that we're about to run code
                setStatus(PythonKernelStatus.BUSY);

                // Run the code with specific callbacks for this execution
                await kernelRef.current.runPython(
                    code,
                    namespaceId,
                    proxy(stdoutCallback),
                    proxy(stderrCallback)
                );
            } catch (error) {
                if (stderrCallback) {
                    stderrCallback(`${error.message || String(error)}`);
                }
            } finally {
                setStatus(PythonKernelStatus.IDLE);
            }
        },
        [initKernel, status, setStatus]
    );

    return (
        <PythonContext.Provider
            value={{
                status,
                getExecutionCount,
                runPython,
                createDataFrame: kernelRef.current?.createDataFrame,
            }}
        >
            {children}
        </PythonContext.Provider>
    );
}

export { PythonContext, PythonProvider };
