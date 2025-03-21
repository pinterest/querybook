export interface Task {
    run: () => Promise<void>;
    resolve: () => void;
    reject: (error: any) => void;
}

/**
 * A simple task queue that runs tasks in sequence.
 */
export class TaskQueue {
    private queue: Task[] = [];
    private isRunning: boolean = false;

    // Add a task to the queue and immediately attempt to run the next task
    public push(task: Task) {
        this.queue.push(task);
        this.runNext();
    }

    private async runNext() {
        // If a task is already running or queue is empty, do nothing.
        if (this.isRunning || this.queue.length === 0) {
            return;
        }

        // Pull the next task from the queue.
        const task = this.queue.shift();
        if (!task) return;

        this.isRunning = true;
        try {
            await task.run();
            task.resolve();
        } catch (error) {
            task.reject(error);
        } finally {
            this.isRunning = false;
            // Process the next task in queue.
            this.runNext();
        }
    }
}
