import {
    Reducer,
    useCallback,
    useEffect,
    useReducer,
    useRef,
    useState,
} from 'react';

import { ICancelablePromise } from 'lib/datasource';
import { IPaginatedResource } from 'resource/types';

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
    initialOffset?: number;
    batchSize?: number;
    fetchOnInit?: boolean;
}

export function usePaginatedResource<T>(
    resource: IPaginatedResource<T>,
    { initialOffset = 0, batchSize = 50, fetchOnInit = true }: IFetchArgs = {}
) {
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
    }, [resource, initialOffset, version]);

    useEffect(() => {
        let didCancel = false;
        let request: ICancelablePromise<{ data: T[] }> = null;

        const fetchData = async () => {
            dispatch({
                type: 'FETCH_INIT',
            });

            try {
                request = resource(batchSize, offset);
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
    }, [resource, batchSize, offset, shouldFetch, version]);

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
