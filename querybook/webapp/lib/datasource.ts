import axios, { AxiosRequestConfig, Canceler, Method } from 'axios';
import toast from 'react-hot-toast';

import { setSessionExpired } from 'lib/querybookUI';
import { formatError } from 'lib/utils/error';

export interface ICancelablePromise<T> extends Promise<T> {
    cancel?: Canceler;
}

type UrlOrOptions = string | AxiosRequestConfig;

function handleRequestException(error: any, notifyOnError?: boolean) {
    console.error(error);

    if (notifyOnError) {
        toast.error(formatError(error));
    }

    if (error?.response?.status === 401) {
        setSessionExpired();
    }

    return Promise.reject(error);
}

function syncDatasource<T>(
    method: Method,
    urlOrOptions: UrlOrOptions,
    data?: Record<string, unknown>,
    notifyOnError?: boolean,
    timeout: number = 0 // timeout in milliseconds
): ICancelablePromise<{ data: T }> {
    const url =
        typeof urlOrOptions === 'string' ? urlOrOptions : urlOrOptions['url'];

    let cancel: Canceler;
    const defaultConfig: AxiosRequestConfig = {
        url,
        baseURL: '/ds',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
        method,
        cancelToken: new axios.CancelToken((c) => (cancel = c)),
        timeout, // 0 is the default value which means no timeout
    };

    if (data) {
        if (method === 'GET') {
            defaultConfig.params = {
                params: JSON.stringify(data),
            };
        } else {
            defaultConfig.data = data;
        }
    }

    const combinedConfig =
        typeof urlOrOptions === 'string'
            ? defaultConfig
            : {
                  ...defaultConfig,
                  ...urlOrOptions,
              };

    const request: ICancelablePromise<any> = axios.request(combinedConfig).then(
        (resp) => {
            if (resp.status === 200) {
                return Promise.resolve(resp.data);
            } else {
                return handleRequestException(resp, notifyOnError);
            }
        },
        (rej) => handleRequestException(rej, notifyOnError)
    );

    request.cancel = cancel;

    return request;
}

function fetchDatasource<T>(
    urlOrOptions: UrlOrOptions,
    data?: Record<string, unknown>,
    notifyOnError = false,
    timeout?: number
) {
    return syncDatasource<T>('GET', urlOrOptions, data, notifyOnError, timeout);
}

function saveDatasource<T>(
    urlOrOptions: UrlOrOptions,
    data?: Record<string, unknown>,
    notifyOnError = true,
    timeout?: number
) {
    return syncDatasource<T>(
        'POST',
        urlOrOptions,
        data,
        notifyOnError,
        timeout
    );
}

function updateDatasource<T>(
    urlOrOptions: UrlOrOptions,
    data?: Record<string, unknown>,
    notifyOnError = true,
    timeout?: number
) {
    return syncDatasource<T>('PUT', urlOrOptions, data, notifyOnError, timeout);
}

function deleteDatasource<T = null>(
    urlOrOptions: UrlOrOptions,
    data?: Record<string, unknown>,
    notifyOnError = true,
    timeout?: number
) {
    return syncDatasource<T>(
        'DELETE',
        urlOrOptions,
        data,
        notifyOnError,
        timeout
    );
}

export function uploadDatasource<T = null>(
    url: string,
    data: Record<string, any>,
    notifyOnError = true,
    timeout?: number
) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
        let strOrBlobValue = value;
        if (
            !(
                strOrBlobValue instanceof Blob ||
                strOrBlobValue instanceof String
            )
        ) {
            strOrBlobValue = JSON.stringify(strOrBlobValue);
        }

        formData.append(key, strOrBlobValue);
    }

    const urlOptions: AxiosRequestConfig = {
        url,
        headers: {
            'Content-Type': 'multipart/form-data; charset=utf-8',
        },
        data: formData,
    };
    return syncDatasource<T>('POST', urlOptions, null, notifyOnError, timeout);
}

export default {
    fetch: fetchDatasource,
    save: saveDatasource,
    update: updateDatasource,
    delete: deleteDatasource,
    upload: uploadDatasource,
};
