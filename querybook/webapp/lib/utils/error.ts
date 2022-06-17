import { AxiosError } from 'axios';
import moment from 'moment';

import { formatDuration, generateFormattedDate } from './datetime';

export function formatError(error: any): string {
    if (typeof error === 'string') {
        return error;
    }

    const isErrorObject =
        error != null &&
        typeof error === 'object' &&
        error.constructor === Error;
    if (isErrorObject) {
        if (isAxiosError(error)) {
            if (error.response) {
                if (
                    error.response.data &&
                    typeof error.response.data === 'object'
                ) {
                    // The request was made and the server responded with a status code > 2xx
                    if ('error' in error.response.data) {
                        return error.response.data.error;
                    }
                }

                if (
                    error.response.status === 429 &&
                    'flask-limit-key' in error.response.headers
                ) {
                    // Rate limit error from Flask-Limiter
                    return formatRateLimitError(error.response.headers);
                }
            }
        } else {
            // unknown error, maybe syntax?
        }
    }

    return JSON.stringify(error, null, 2);
}

export function isAxiosError(e: any): e is AxiosError {
    return e instanceof Error && (e as AxiosError).isAxiosError;
}

function formatRateLimitError(headers: Record<string, string>) {
    const limitKey = headers['flask-limit-key'];
    const limitAmount = headers['flask-limit-amount'];
    const limitWindowSize = Number(headers['flask-limit-window-size']);
    const limitResetAt = Number(headers['flask-limit-reset-at']);

    const exceededMessage = `Rate limit ${limitAmount} requests per ${formatDuration(
        moment.duration(limitWindowSize, 'seconds')
    )} exceeded.`;
    const retryMessage = `Please retry after ${generateFormattedDate(
        limitResetAt,
        'X'
    )}.`;

    return `${exceededMessage} ${retryMessage} (key: ${limitKey})`;
}
