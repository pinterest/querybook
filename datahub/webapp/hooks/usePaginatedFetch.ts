import {
    useState,
    useEffect,
    useReducer,
    useCallback,
    useRef,
    Reducer,
} from 'react';
import stringify from 'fast-json-stable-stringify';

import ds, { ICancelablePromise } from 'lib/datasource';

interface IDataFetchState<T = any> {
    isLoading: boolean;
    isError: boolean;
    data: T[];
    hasMore: boolean;
}

const initialFetchReducerState: IDataFetchState = {
    data: [],
    isLoading: false,
    isError: false,
    hasMore: true,
};

function dataFetchReducer<T>(state: IDataFetchState<T>, action) {
    switch (action.type) {
        case 'INIT_STATE': {
            return initialFetchReducerState;
        }
        case 'FETCH_INIT':
            return {
                ...state,
                isLoading: true,
                isError: false,
            };
        case 'FETCH_SUCCESS':
            return {
                isLoading: false,
                isError: false,
                data: state.data.concat(action.payload.data),
                hasMore: action.payload.hasMore,
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
    url: string;
    params?: Record<string | number, unknown>;
    type?: 'fetch' | 'save' | 'delete' | 'update';
    initialOffset?: number;
    batchSize?: number;
    fetchOnInit?: boolean;
}

export function usePaginatedFetch<T>({
    url,
    params = {},
    type = 'fetch',
    initialOffset = 0,
    batchSize = 50,
    fetchOnInit = true,
}: IFetchArgs) {
    const [version, setVersion] = useState(0);
    const [shouldFetch, setShouldFetch] = useState(fetchOnInit);
    const [offset, setOffset] = useState(initialOffset);
    const [state, dispatch] = useReducer<Reducer<IDataFetchState<T>, any>>(
        dataFetchReducer,
        initialFetchReducerState
    );
    const promiseRef = useRef<any>(null);

    useEffect(() => {
        dispatch({
            type: 'INIT_STATE',
        });
        setOffset(initialOffset);
    }, [url, stringify(params), type, initialOffset, version]);

    useEffect(() => {
        let didCancel = false;
        let request: ICancelablePromise<{ data: T[] }> = null;

        const fetchData = async () => {
            dispatch({
                type: 'FETCH_INIT',
            });

            try {
                request = ds[type](url, {
                    ...params,
                    limit: batchSize,
                    offset,
                });
                promiseRef.current = request;

                const result = await request;
                if (!didCancel) {
                    dispatch({
                        type: 'FETCH_SUCCESS',
                        payload: {
                            data: result.data,
                            hasMore: result.data.length === batchSize,
                        },
                    });
                }
            } catch (error) {
                if (!didCancel || error.name !== 'AbortError') {
                    dispatch({
                        type: 'FETCH_FAILURE',
                    });
                }
            }
        };

        if (shouldFetch) {
            fetchData();
        }

        return () => {
            didCancel = true;
            promiseRef.current = null;
            if (request) {
                request.cancel();
            }
        };
    }, [stringify(params), url, type, batchSize, offset, shouldFetch, version]);

    const fetchMore = useCallback(async () => {
        if (promiseRef.current) {
            await promiseRef.current;
        }
        if (shouldFetch) {
            setOffset(offset + batchSize);
        } else {
            setShouldFetch(true);
        }
    }, [offset, batchSize, shouldFetch]);

    return {
        ...state,
        fetchMore,

        reset: () => setVersion(version + 1),
    };
}
