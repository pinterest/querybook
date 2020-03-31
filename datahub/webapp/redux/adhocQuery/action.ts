import {
    IReceiveAdhocQueryAction,
    IReceiveAdhocQueryEngineIdAction,
    IReceiveAdhocQueryExecutionIdAction,
} from './types';

export function receiveAdhocQuery(query: string): IReceiveAdhocQueryAction {
    return {
        type: '@@adhocQuery/RECEIVE_ADHOC_QUERY',
        payload: {
            query,
        },
    };
}

export function receiveAdhocEngineId(
    engineId: number
): IReceiveAdhocQueryEngineIdAction {
    return {
        type: '@@adhocQuery/RECEIVE_ADHOC_QUERY_ENGINE_ID',
        payload: {
            engineId,
        },
    };
}

export function receiveAdhocExecutionId(
    executionId: number
): IReceiveAdhocQueryExecutionIdAction {
    return {
        type: '@@adhocQuery/RECEIVE_ADHOC_QUERY_EXECUTION_ID',
        payload: {
            executionId,
        },
    };
}
