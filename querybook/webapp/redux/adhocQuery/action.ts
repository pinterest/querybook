import { IAdhocQuery } from 'const/adhocQuery';
import { fetchQueryExecutionIfNeeded } from 'redux/queryExecutions/action';

import { loadAdhocQuery } from './persistence';
import { ISetAdhocQueryAction, ThunkResult } from './types';

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
        const isAdhocQueryDefined = () =>
            environmentId in getState().adhocQuery;

        if (isAdhocQueryDefined()) {
            return;
        }

        const adhocQuery = await loadAdhocQuery(environmentId);
        if (!adhocQuery || isAdhocQueryDefined()) {
            // Checking reduxState again since it is possible that
            // adhoc query gets defined while the adhocQuery
            // is loaded from the store
            return;
        }

        if (adhocQuery.executionId) {
            dispatch(fetchQueryExecutionIfNeeded(adhocQuery.executionId));
        }
        dispatch(receiveAdhocQuery(adhocQuery, environmentId));
    };
}
