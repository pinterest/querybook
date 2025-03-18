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

    // Kernel has encountered an error.
    FAILED = 'failed',
}

/**
 * Interface representing a Python kernel for executing Python code and managing namespaces.
 */
export interface PythonKernel {
    /**
     * Initializes the kernel, optionally installing the specified packages.
     * @param packages - An optional array of package names to install during initialization.
     * @returns A promise that resolves when the kernel is initialized.
     */
    initialize: (packages?: string[]) => Promise<void>;

    /**
     * Executes the given Python code within the specified namespace.
     * If `namespaceId` is not provided, a temporary namespace will be used.
     * @param code - The Python code to execute.
     * @param namespaceId - An optional ID of the namespace to execute the code in.
     * @param stdoutCallback - An optional callback to handle standard output from the execution.
     * @param stderrCallback - An optional callback to handle standard error output from the execution.
     * @returns A promise that resolves when the execution is complete.
     */
    runPython: (
        code: string,
        namespaceId?: number,
        stdoutCallback?: (text: string) => void,
        stderrCallback?: (text: string) => void
    ) => Promise<void>;

    /**
     * Cancels the currently running code execution.
     */
    cancelRun: () => void;

    /**
     * Creates a DataFrame in the specified namespace.
     * @param dfName - The name of the DataFrame to create.
     * @param records - The data records for the DataFrame.
     * @param columns - The column names for the DataFrame.
     * @param namespaceId - The ID of the namespace where the DataFrame will be created.
     * @param stdoutCallback - An optional callback to handle standard output during creation.
     * @param stderrCallback - An optional callback to handle standard error output during creation.
     * @returns A promise that resolves when the DataFrame is created.
     */
    createDataFrame: (
        dfName: string,
        records: any[][],
        columns: string[],
        namespaceId: number
    ) => Promise<void>;

    /**
     * Retrieves the execution count for the specified namespace.
     * @param namespaceId - The ID of the namespace.
     * @returns The execution count for the specified namespace.
     */
    getExecutionCount: (namespaceId: number) => number;

    /**
     * Returns a list of variable names in the specified namespace.
     * @param namespaceId - The ID of the namespace.
     * @returns An array of variable names in the specified namespace.
     */
    getNamespaceVariables: (namespaceId: number) => string[];

    /**
     * The version of the Python kernel.
     */
    version: string;
}
