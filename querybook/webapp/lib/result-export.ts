import {
    IQueryResultExporter,
    QueryExecutionExportStatus,
} from 'const/queryExecution';
import { StatementResource } from 'resource/queryExecution';

export function getExporterAuthentication(
    exporter: IQueryResultExporter
): Promise<void> {
    return new Promise(async (resolve, reject) => {
        if (!exporter.requires_auth) {
            resolve();
            return;
        }

        const { data: url } = await StatementResource.getExporterAuth(
            exporter.name
        );
        if (!url) {
            resolve();
            return;
        }

        const authWindow = window.open(url);
        const receiveMessage = () => {
            authWindow.close();
            delete window.receiveChildMessage;
            window.removeEventListener('message', receiveMessage, false);
            resolve();
        };
        window.receiveChildMessage = receiveMessage;

        // If window is closed without having received message
        const timer = setInterval(() => {
            if (authWindow.closed) {
                clearInterval(timer);
                reject(Error('Authentication process failed'));
            }
        }, 1000);
    });
}

export const pollExporterTaskPromise = (taskId: string) =>
    new Promise((res, rej) => {
        const poll = setInterval(async () => {
            const { data } = await StatementResource.pollExportTask(taskId);
            const { status } = data;
            if (status === QueryExecutionExportStatus.ERROR) {
                clearInterval(poll);
                rej(new Error(data.message ?? 'unknown error'));
            } else if (status === QueryExecutionExportStatus.DONE) {
                clearInterval(poll);
                res(data);
            }
        }, 5000);
    });
