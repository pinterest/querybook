import { Task, TaskQueue } from './task-queue';
import { expose } from 'comlink';
import { loadPyodide, PyodideInterface, version } from 'pyodide';

import type { PyProxy } from 'pyodide/ffi';

import { patchPyodide } from './patch';
import {
    PythonExecutionStatus,
    PythonKernel,
    PythonNamespaceInfo,
} from './types';

// Constants
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${version}/full/`;
const DEFAULT_PACKAGES = ['micropip', 'numpy', 'pandas', 'matplotlib'];

declare global {
    interface Window {
        envirionment: string;
    }
}
self.envirionment = '';

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
    private taskQueue = new TaskQueue();

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
     * Run Python code using a task queue to ensure sequential execution
     */
    public async runPython(
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
    ): Promise<void> {
        this._ensurePyodide();

        return new Promise((resolve, reject) => {
            const task: Task = {
                run: async () => {
                    // Call the actual runPython method.
                    await this._runPython(
                        code,
                        namespaceId,
                        progressCallback,
                        stdoutCallback,
                        stderrCallback
                    );
                },
                resolve,
                reject,
            };
            this.taskQueue.push(task);
        });
    }

    /**
     * Get the namespace information for a given namespace
     */
    public async getNamespaceInfo(namespaceId: number): Promise<string> {
        this._ensurePyodide();

        const namespace = this._getNamespace(namespaceId);
        const identifiers = await this.pyodide.globals.get(
            '_get_namespace_identifiers'
        )(namespace);
        const executionCount = this.executionCountByNS[namespaceId];

        const info: PythonNamespaceInfo = {
            identifiers: identifiers.toJs(),
            executionCount,
        };
        // return names.toJs();
        return JSON.stringify(info);
    }

    public setEnvironment(env: string) {
        self.envirionment = env;
    }

    /**
     * Inject variables into a Python namespace
     */
    public injectVariables(
        namespaceId: number,
        variables: Record<string, any>
    ) {
        this._ensurePyodide();

        const namespace = this._getNamespace(namespaceId);

        // Inject each variable into the namespace
        for (const [name, value] of Object.entries(variables)) {
            namespace.set(name, value);
        }
    }

    /**
     * Run Python code in the specified namespace
     */
    private async _runPython(
        code: string,
        namespaceId?: number,
        progressCallback?: (
            status: PythonExecutionStatus,
            data?: {
                executionCount?: number;
            }
        ) => void,
        stdoutCallback?: (code: string) => void,
        stderrCallback?: (code: string) => void
    ): Promise<void> {
        progressCallback?.(PythonExecutionStatus.RUNNING);

        if (namespaceId !== undefined) {
            this.executionCountByNS[namespaceId] ??= 0;
            this.executionCountByNS[namespaceId]++;
        }
        const executionCount = this.executionCountByNS[namespaceId];

        try {
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
                // globals vs locals: https://github.com/pyodide/pyodide/issues/4673
                globals: namespace,
            });

            // Print result if not undefined
            if (result !== undefined) {
                this.pyodide.globals.get('_custom_print')(result);
            }
            progressCallback?.(PythonExecutionStatus.SUCCESS, {
                executionCount,
            });
        } catch (error) {
            if (error.message?.includes('KeyboardInterrupt')) {
                progressCallback?.(PythonExecutionStatus.CANCEL, {
                    executionCount,
                });
            } else {
                progressCallback?.(PythonExecutionStatus.ERROR, {
                    executionCount,
                });
            }
            stderrCallback?.(`${error.message || String(error)}`);
        }
    }

    /**
     * Ensure that pyodide is initialized
     */
    private _ensurePyodide(): void {
        if (!this.pyodide) {
            throw new Error('Pyodide not initialized');
        }
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

        // Load additional packages if specified
        if (additionalPackages.length > 0) {
            const micropip = this.pyodide.pyimport('micropip');
            await micropip.install(additionalPackages);
        }

        // Apply patches
        await patchPyodide(this.pyodide);
    }

    /**
     * Get or create a namespace for the given ID
     */
    private _getNamespace(namespaceId?: number): PyProxy {
        this._ensurePyodide();

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
