import { AxiosError } from 'axios';
import { isObject } from 'lodash';
import moment from 'moment';

import { formatDuration, generateFormattedDate } from './datetime';

export type AxiosErrorWithMessage = AxiosError<{ error?: string }>;
export function formatError(error: any): string {
    if (typeof error === 'string') {
        return error;
    }

    const isErrorObject = isObject(error);
    if (isErrorObject) {
        if (isAxiosError(error)) {
            if (isAxiosErrorWithMessage(error)) {
                return error.response.data.error;
            }

            if (error.response) {
                if (
                    error.response.status === 429 &&
                    'flask-limit-key' in error.response.headers
                ) {
                    // Rate limit error from Flask-Limiter
                    return formatRateLimitError(error.response.headers);
                }
            }

            if (error.message) {
                return error.message;
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

export function isAxiosErrorWithMessage(e: any): e is AxiosErrorWithMessage {
    if (
        isAxiosError(e) &&
        e.response &&
        e.response.data &&
        typeof e.response.data === 'object' &&
        'error' in e.response.data
    ) {
        return true;
    }
    return false;
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
