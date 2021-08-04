import { AxiosError } from 'axios';

export function formatError(error: any): string {
    if (typeof error === 'string') {
        return error;
    }

    const isErrorObject =
        error != null &&
        typeof error === 'object' &&
        error.constructor === Error;
    if (isErrorObject) {
        if (
            error.response &&
            error.response.data &&
            typeof error.response.data === 'object'
        ) {
            // The request was made and the server responded with a status code > 2xx
            if ('error' in error.response.data) {
                return error.response.data.error;
            }
        } else if (error.request) {
            // The request was made but no response was received
        } else {
            // unknown error, maybe syntax?
        }
    }

    return JSON.stringify(error, null, 2);
}

export function isAxiosError(e: any): e is AxiosError {
    return e instanceof Error && (e as AxiosError).isAxiosError;
}
