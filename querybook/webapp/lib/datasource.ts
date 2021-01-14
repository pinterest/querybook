import axios, { AxiosRequestConfig, Canceler, Method } from 'axios';
import { setSessionExpired } from 'lib/querybookUI';
import { formatError } from 'lib/utils/error';
import toast from 'react-hot-toast';

export interface ICancelablePromise<T> extends Promise<T> {
    cancel?: Canceler;
}

type UrlOrOptions = string | AxiosRequestConfig;

function handleRequestException(error: any, notifyOnError?: boolean) {
    if (notifyOnError) {
        toast.error(formatError(error));
    }

    if (error?.response?.status === 401) {
        setSessionExpired();
    }

    return Promise.reject(error);
}

function syncDatasource<T = any>(
    method: Method,
    urlOrOptions: UrlOrOptions,
    data?: Record<string, unknown>,
    notifyOnError?: boolean
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
    };

    if (data) {
        if (method === 'GET') {
            defaultConfig.params = {
                params: data,
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

function fetchDatasource<T = any>(
    urlOrOptions: UrlOrOptions,
    data?: Record<string, unknown>,
    notifyOnError = false
) {
    return syncDatasource<T>('GET', urlOrOptions, data, notifyOnError);
}

function saveDatasource<T = any>(
    urlOrOptions: UrlOrOptions,
    data?: Record<string, unknown>,
    notifyOnError = true
) {
    return syncDatasource<T>('POST', urlOrOptions, data, notifyOnError);
}

function updateDatasource<T = any>(
    urlOrOptions: UrlOrOptions,
    data?: Record<string, unknown>,
    notifyOnError = true
) {
    return syncDatasource<T>('PUT', urlOrOptions, data, notifyOnError);
}
function deleteDatasource<T = any>(
    urlOrOptions: UrlOrOptions,
    data?: Record<string, unknown>,
    notifyOnError = true
) {
    return syncDatasource<T>('DELETE', urlOrOptions, data, notifyOnError);
}

export default {
    fetch: fetchDatasource,
    save: saveDatasource,
    update: updateDatasource,
    delete: deleteDatasource,
};
