export interface IBatchManagerOptions<T, M> {
    batchFrequency?: number;
    processFunction: (mergedChange: M) => Promise<any>;
    mergeFunction?: (changes: Array<IBatchPromise<T>>) => IBatchPromise<M>;
}

interface IBatchPromise<T> {
    data: T;
    onSuccess: () => void;
    onFailure: () => void;
}

export function pickLastMergeFunction<T, M>(changes: Array<IBatchPromise<T>>) {
    return (changes[changes.length - 1] as unknown) as IBatchPromise<M>;
}

export function spreadMergeFunction<
    T = Record<string | number, unknown>,
    M = Record<string | number, unknown>
>(changes: Array<IBatchPromise<T>>) {
    const mergedData = (changes.reduce(
        (hash, change) => ({
            ...hash,
            ...change.data,
        }),
        {}
    ) as unknown) as M;
    const { onSuccess, onFailure } = changes[changes.length - 1];
    return {
        onSuccess,
        onFailure,
        data: mergedData,
    };
}

export function mergeSetFunction<T>(changes: Array<IBatchPromise<T>>) {
    return {
        data: [...new Set(changes.map((c) => c.data))],
        onSuccess: () => changes.forEach((c) => c.onSuccess()),
        onFailure: () => changes.forEach((c) => c.onFailure()),
    };
}

export class BatchManager<T, M> {
    private changeVersion: number = 0;
    private processTimeout: number = null;
    private batchStack: Array<IBatchPromise<T>> = [];
    private processRequest: Promise<any> = null;

    private batchFrequency: number;
    private processFunction: (mergedChange: M) => Promise<any> = null;
    private mergeFunction: (
        changes: Array<IBatchPromise<T>>
    ) => IBatchPromise<M>;

    public constructor(options: IBatchManagerOptions<T, M>) {
        const {
            processFunction,
            mergeFunction = pickLastMergeFunction,
            batchFrequency = 2000,
        } = options;

        this.batchFrequency = batchFrequency;
        this.processFunction = processFunction;
        this.mergeFunction = mergeFunction;
    }

    public forceProcess() {
        // Nothing to save
        if (this.batchStack.length === 0) {
            return;
        }

        clearInterval(this.processTimeout);
        this.processBatch(++this.changeVersion, true);
    }

    public batch(data: T): Promise<void> {
        return new Promise((onSuccess, onFailure) => {
            this.batchStack.push({
                data,
                onSuccess,
                onFailure,
            });

            clearInterval(this.processTimeout);
            this.processTimeout = setTimeout(
                this.processBatch.bind(this, ++this.changeVersion),
                this.batchFrequency
            );
        });
    }

    private processBatch = async (version: number, force: boolean = false) => {
        // If there is another save or nothing to save, skip
        if (this.changeVersion !== version || this.batchStack.length === 0) {
            return;
        }

        if (this.processRequest && !force) {
            await this.processRequest;
        }

        // We only notifiy the last one
        const { onSuccess, onFailure, data: mergedData } = this.mergeFunction(
            this.batchStack
        );
        // Clear the batch
        this.batchStack = [];
        try {
            this.processRequest = this.processFunction(mergedData);
            await this.processRequest;
            onSuccess();
        } catch (e) {
            onFailure();
        } finally {
            this.processRequest = null;
        }
    };
}
