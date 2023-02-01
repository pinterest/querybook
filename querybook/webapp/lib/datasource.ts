import axios, { AxiosRequestConfig, Canceler, Method } from 'axios';
import toast from 'react-hot-toast';

import { setSessionExpired } from 'lib/querybookUI';
import { formatError } from 'lib/utils/error';

export interface ICancelablePromise<T> extends Promise<T> {
    cancel?: Canceler;
}

type UrlOrOptions = string | AxiosRequestConfig;
interface DatasourceOptions {
    notifyOnError?: boolean;
    timeout?: number;
}

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
    options: DatasourceOptions = {}
): ICancelablePromise<{ data: T }> {
    const url =
        typeof urlOrOptions === 'string' ? urlOrOptions : urlOrOptions['url'];
    const { notifyOnError = false, timeout = 0 } = options;

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
    options: DatasourceOptions = {
        notifyOnError: false,
    }
) {
    return syncDatasource<T>('GET', urlOrOptions, data, options);
}

function saveDatasource<T>(
    urlOrOptions: UrlOrOptions,
    data?: Record<string, unknown>,
    options: DatasourceOptions = {
        notifyOnError: true,
    }
) {
    return syncDatasource<T>('POST', urlOrOptions, data, options);
}

function updateDatasource<T>(
    urlOrOptions: UrlOrOptions,
    data?: Record<string, unknown>,
    options: DatasourceOptions = {
        notifyOnError: true,
    }
) {
    return syncDatasource<T>('PUT', urlOrOptions, data, options);
}

function deleteDatasource<T = null>(
    urlOrOptions: UrlOrOptions,
    data?: Record<string, unknown>,
    options: DatasourceOptions = {
        notifyOnError: true,
    }
) {
    return syncDatasource<T>('DELETE', urlOrOptions, data, options);
}

export function uploadDatasource<T = null>(
    url: string,
    data: Record<string, any>,
    options: DatasourceOptions = {
        notifyOnError: true,
    }
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
    return syncDatasource<T>('POST', urlOptions, null, options);
}

export default {
    fetch: fetchDatasource,
    save: saveDatasource,
    update: updateDatasource,
    delete: deleteDatasource,
    upload: uploadDatasource,
};
