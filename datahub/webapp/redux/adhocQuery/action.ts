import { IAdhocQuery } from 'const/adhocQuery';
import { fetchQueryExecutionIfNeeded } from 'redux/queryExecutions/action';
import { ISetAdhocQueryAction, ThunkResult } from './types';
import { loadAdhocQuery } from './persistence';

export function receiveAdhocQuery(
    adhocQuery: Partial<IAdhocQuery>,
    environmentId: number
): ISetAdhocQueryAction {
    return {
        type: '@@adhocQuery/SET_ADHOC_QUERY',
        payload: {
            adhocQuery,
            environmentId,
        },
    };
}

export function rehydrateAdhocQueryForEnvironment(
    environmentId: number
): ThunkResult<Promise<void>> {
    return async (dispatch, getState) => {
        const adhocQueryExistsInState = environmentId in getState().adhocQuery;
        if (adhocQueryExistsInState) {
            return;
        }

        const adhocQuery = await loadAdhocQuery(environmentId);
        if (adhocQuery) {
            if (adhocQuery.executionId) {
                dispatch(fetchQueryExecutionIfNeeded(adhocQuery.executionId));
            }

            dispatch(receiveAdhocQuery(adhocQuery, environmentId));
        }
    };
}
