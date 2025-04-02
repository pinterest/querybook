// Enum representing the various states of the Python kernel.
export enum PythonKernelStatus {
    // Kernel has not been initialized.
    UNINITIALIZED = 'uninitialized',

    // Kernel is in the process of initializing.
    INITIALIZING = 'initializing',

    // Kernel is idle and ready to execute code.
    IDLE = 'idle',

    // Kernel is currently executing code.
    BUSY = 'busy',

    // Kernel has encountered an error when initializing.
    FAILED = 'failed',
}

export enum PythonExecutionStatus {
    // Execution is pending.
    PENDING = 'pending',

    // Execution is running.
    RUNNING = 'running',

    // Execution completed successfully.
    SUCCESS = 'success',

    // Execution failed.
    ERROR = 'error',

    // Execution was cancelled.
    CANCEL = 'cancel',
}

export interface PythonIdentifierInfo {
    name: string;
    type: string;
}

export interface PythonNamespaceInfo {
    // The execution count of the namespace.
    executionCount: number;

    // The list of identifiers in the namespace.
    identifiers: PythonIdentifierInfo[];
}

export enum InterruptBufferStatus {
    RESET = 0, // Reset
    SIGINT = 2, // Interrupt the execution
}

/**
 * Interface representing a Python kernel for executing Python code and managing namespaces.
 */
export interface PythonKernel {
    /**
     * Initializes the kernel, optionally installing the specified packages.
     *
     * @param packages - An optional array of package names to install during initialization.
     * @returns A promise that resolves when the kernel is initialized.
     */
    initialize: (packages?: string[]) => Promise<void>;

    /**
     * Executes the given Python code within the specified namespace.
     * If `namespaceId` is not provided, a temporary namespace will be used.
     *
     * @param code - The Python code to execute.
     * @param namespaceId - An optional ID of the namespace to execute the code in.
     * @param progressCallback - An optional callback to handle execution status updates.
     * @param stdoutCallback - An optional callback to handle standard output from the execution.
     * @param stderrCallback - An optional callback to handle standard error output from the execution.
     * @returns A promise that resolves when the execution is complete.
     */
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

    /**
     * Creates a DataFrame in the specified namespace.
     *
     * @param dfName - The name of the DataFrame to create.
     * @param statementExecutionId - The ID of the statement execution that created the DataFrame.
     * @param namespaceId - The ID of the namespace where the DataFrame will be created.
     * @returns A promise that resolves when the DataFrame is created.
     */
    createDataFrame: (
        dfName: string,
        statementExecutionId: number,
        namespaceId: number
    ) => Promise<void>;

    /**
     * Retrieves information about the specified namespace, including the execution count and identifiers.
     *
     * @param namespaceId - The ID of the namespace.
     * @returns JSON string containing the namespace information (PythonNamespaceInfo).
     */
    getNamespaceInfo: (namespaceId: number) => Promise<string>;

    /**
     * Sets the current Querybook environment for the kernel.
     * @param env - The environment name to set for the kernel.
     */
    setEnvironment(env: string): void;

    /**
     * The shared interrupt buffer used to cancel the current execution
     */
    interruptBuffer: Uint8Array | null;

    /**
     * The version of the Python kernel.
     */
    version: string;
}
