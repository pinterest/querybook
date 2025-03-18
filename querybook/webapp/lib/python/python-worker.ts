import { expose } from 'comlink';
import { loadPyodide, PyodideInterface, version } from 'pyodide';

import type { PyProxy } from 'pyodide/ffi';

import { patchPyodide } from './patch';
import { PythonKernel } from './types';

// Constants
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`;
const DEFAULT_PACKAGES = ['micropip', 'numpy', 'pandas', 'matplotlib'];

/**
 * PyodideKernel - Handles Pyodide initialization and execution
 * Implements the PythonKernel interface
 */
class PyodideKernel implements PythonKernel {
    public version = version;

    private loadPyodidePromise: Promise<void> | null = null;
    private namespaces: Record<number, PyProxy> = {};
    private executionCountByNS: Record<number, number> = {};
    private pyodide: PyodideInterface | null = null;
    private interruptBuffer: Uint8Array | null = null;

    /**
     * Initialize pyodide with specified packages
     *
     * @param packages - Additional packages to load via micropip
     */
    public async initialize(packages: string[] = []): Promise<void> {
        if (this.loadPyodidePromise !== null) {
            throw new Error('Pyodide was already initialized');
        }

        this.loadPyodidePromise = this._loadPyodide(packages);
        return this.loadPyodidePromise;
    }

    /**
     * Run Python code in the specified namespace
     *
     * @returns The result of the execution, if any
     */
    public async runPython(
        code: string,
        namespaceId?: number,
        stdoutCallback?: ((text: string) => void) | null,
        stderrCallback?: ((text: string) => void) | null
    ): Promise<void> {
        if (!this.loadPyodidePromise) {
            throw new Error(
                'Pyodide not initialized. Call initialize() first.'
            );
        }

        await this.loadPyodidePromise;

        if (!this.pyodide || !this.interruptBuffer) {
            throw new Error('Pyodide initialization failed');
        }

        // Reset interrupt buffer and set status
        this.interruptBuffer[0] = 0;
        this.executionCountByNS[namespaceId] =
            this.getExecutionCount(namespaceId) + 1;

        // Load any required packages from imports
        await this.pyodide.loadPackagesFromImports(code);

        // Set I/O handlers
        this.pyodide.setStdout(
            stdoutCallback ? { batched: stdoutCallback } : undefined
        );
        this.pyodide.setStderr(
            stderrCallback ? { batched: stderrCallback } : undefined
        );

        // Get namespace for execution
        const namespace = this._getNamespace(namespaceId);

        // Execute the code
        const result = await this.pyodide.runPythonAsync(code, {
            globals: namespace,
        });

        // Print result if not undefined
        if (result !== undefined) {
            this._customPrint(result);
        }
    }

    /**
     * Cancel the current Python execution
     */
    public cancelRun(): void {
        if (this.interruptBuffer) {
            this.interruptBuffer[0] = 2;
        }
    }

    /**
     * Get the execution count for a namespace
     */
    public getExecutionCount(namespaceId: number): number {
        return this.executionCountByNS[namespaceId] || 0;
    }

    /**
     * Create a DataFrame in the specified namespace
     */
    public async createDataFrame(
        dfName: string,
        records: any[][],
        columns: string[],
        namespaceId: number
    ): Promise<void> {
        if (!this.loadPyodidePromise) {
            throw new Error(
                'Pyodide not initialized. Call initialize() first.'
            );
        }

        await this.loadPyodidePromise;

        if (!this.pyodide) {
            throw new Error('Pyodide initialization failed');
        }

        const namespace = this._getNamespace(namespaceId);
        const df = this._createDataFrame(records, columns);
        namespace.set(dfName, df);
    }

    /**
     * Get variables in the specified namespace
     */
    public getNamespaceVariables(namespaceId: number): string[] {
        if (!this.loadPyodidePromise) {
            throw new Error(
                'Pyodide not initialized. Call initialize() first.'
            );
        }

        const namespace = this._getNamespace(namespaceId);
        return Object.keys(namespace.toJs()).filter(
            (key) => key !== '__builtins__'
        );
    }

    /**
     * Load pyodide with specified packages
     *
     * @param additionalPackages - Additional packages to load via micropip
     */
    private async _loadPyodide(
        additionalPackages: string[] = []
    ): Promise<void> {
        this.pyodide = await loadPyodide({
            indexURL: INDEX_URL,
            packages: DEFAULT_PACKAGES,
        });

        // Set up interrupt buffer
        this.interruptBuffer = new Uint8Array(new ArrayBuffer(1));
        this.pyodide.setInterruptBuffer(this.interruptBuffer);

        // Load additional packages if specified
        if (additionalPackages.length > 0) {
            const micropip = this.pyodide.pyimport('micropip');
            await micropip.install(additionalPackages);
        }

        // Apply patches
        await patchPyodide(this.pyodide);
    }

    /**
     * Custom print function for Python results
     */
    private _customPrint(result: any): void {
        if (!this.pyodide || result === undefined) {
            return;
        }
        this.pyodide.globals.get('_custom_print')(result);
    }

    /**
     * Patched: Create a DataFrame from records and columns
     */
    private _createDataFrame(records: any[][], columns: string[]): any {
        if (!this.pyodide) {
            return null;
        }
        return this.pyodide.globals.get('_create_dataframe')(records, columns);
    }

    /**
     * Get or create a namespace for the given ID
     */
    private _getNamespace(namespaceId?: number): PyProxy {
        if (!this.pyodide) {
            throw new Error('Pyodide not initialized');
        }

        // Create a temporary namespace if no ID is provided
        if (namespaceId === undefined) {
            return this.pyodide.globals.get('dict')();
        }

        if (!this.namespaces[namespaceId]) {
            this.namespaces[namespaceId] = this.pyodide.globals.get('dict')();
        }
        return this.namespaces[namespaceId];
    }
}

// Create and expose the PyodideKernel instance
expose(new PyodideKernel());
