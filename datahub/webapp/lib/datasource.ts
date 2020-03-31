import axios, { AxiosRequestConfig, Canceler } from 'axios';
import { sendNotification } from 'lib/dataHubUI';
import { formatError } from 'lib/utils/error';

export interface ICancelablePromise<T> extends Promise<T> {
    cancel?: Canceler;
}

type UrlOrOptions = string | AxiosRequestConfig;

function handleRequestException(error: any, notifyOnError?: boolean) {
    if (notifyOnError) {
        sendNotification(`FAILED: ${formatError(error)}`);
    }

    return Promise.reject(error);
}

function syncDatasource(
    method: string,
    urlOrOptions: UrlOrOptions,
    data?: {},
    notifyOnError?: boolean
) {
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
        (rej) => {
            return handleRequestException(rej, notifyOnError);
        }
    );

    request.cancel = cancel;

    return request;
}

function fetchDatasource<T = any>(
    urlOrOptions: UrlOrOptions,
    data?: {},
    notifyOnError = false
): ICancelablePromise<{ data: T }> {
    return syncDatasource('GET', urlOrOptions, data, notifyOnError);
}

const saveDatasource = (
    urlOrOptions: UrlOrOptions,
    data?: {},
    notifyOnError = true
) => syncDatasource('POST', urlOrOptions, data, notifyOnError);

const updateDatasource = (
    urlOrOptions: UrlOrOptions,
    data?: {},
    notifyOnError = true
) => syncDatasource('PUT', urlOrOptions, data, notifyOnError);

const deleteDatasource = (
    urlOrOptions: UrlOrOptions,
    data?: {},
    notifyOnError = true
) => syncDatasource('DELETE', urlOrOptions, data, notifyOnError);

export default {
    fetch: fetchDatasource,
    save: saveDatasource,
    update: updateDatasource,
    delete: deleteDatasource,
};

export const dataSelector = ({ data }) => data;
