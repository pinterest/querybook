import {
    useState,
    useEffect,
    useReducer,
    Reducer,
    useCallback,
    useRef,
} from 'react';
import stringify from 'fast-json-stable-stringify';

import ds, { ICancelablePromise } from 'lib/datasource';

interface IDataFetchState<T> {
    isLoading: boolean;
    isError: boolean;
    data: T;
}

function dataFetchReducer<T>(state: IDataFetchState<T>, action) {
    switch (action.type) {
        case 'FETCH_INIT':
            return {
                ...state,
                isLoading: true,
                isError: false,
            };
        case 'FETCH_SUCCESS':
            return {
                ...state,
                isLoading: false,
                isError: false,
                data: action.payload,
            };
        case 'FETCH_FAILURE':
            return {
                ...state,
                isLoading: false,
                isError: true,
            };
        default:
            throw new Error();
    }
}

interface IFetchArgs {
    url?: string;
    params?: Record<string | number, unknown>;
    cancelFetch?: boolean;
    fetchOnMount?: boolean;

    type?: 'fetch' | 'save' | 'delete' | 'update';
}

export function useDataFetch<T = any>(args: IFetchArgs = {}) {
    const [version, setVersion] = useState(0);
    const initialState: IDataFetchState<T> = {
        isLoading: true,
        isError: false,
        data: null,
    };
    const [state, dispatch] = useReducer<Reducer<IDataFetchState<T>, any>>(
        dataFetchReducer,
        initialState
    );
    const fetchParams = {
        url: undefined,
        params: {},
        type: 'fetch',
        cancelFetch: false,
        fetchOnMount: true,
        ...args,
    };
    const forceFetchResolve = useRef<(result: T) => void>(null);

    useEffect(() => {
        if (!fetchParams.fetchOnMount && version === 0) {
            return;
        }

        let didCancel = false;
        let request: ICancelablePromise<{ data: T }> = null;

        const fetchData = async () => {
            dispatch({
                type: 'FETCH_INIT',
            });

            try {
                request = ds[fetchParams.type](
                    fetchParams.url,
                    fetchParams.params
                );
                const result = await request;

                if (!didCancel) {
                    dispatch({
                        type: 'FETCH_SUCCESS',
                        payload: result.data,
                    });
                    if (forceFetchResolve.current) {
                        forceFetchResolve.current(result.data);
                        forceFetchResolve.current = null;
                    }
                }
            } catch (error) {
                if (!didCancel || error.name !== 'AbortError') {
                    dispatch({
                        type: 'FETCH_FAILURE',
                    });
                }
            }
        };
        if (!fetchParams.cancelFetch) {
            fetchData();
        }

        return () => {
            didCancel = true;
            if (request) {
                request.cancel();
            }
        };
    }, [stringify(fetchParams.params), fetchParams.url, version]);

    // const doFetch = (url = ,params = {}, cancelFetch = false) => {
    const forceFetch = useCallback(() => {
        setVersion((prevVersion) => prevVersion + 1);
        return new Promise<T>((resolve) => {
            forceFetchResolve.current = resolve;
        });
    }, []);

    if (!fetchParams.url) {
        throw new Error('Please provide fetch url');
    }

    return {
        ...state,
        forceFetch,
    };
}
