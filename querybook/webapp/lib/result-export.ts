import { IQueryResultExporter } from 'const/queryExecution';
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
