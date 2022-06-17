import { createSelector } from 'reselect';

import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';
import { queryExecutionByIdSelector } from 'redux/queryExecutions/selector';
import { IStoreState } from 'redux/store/types';

const queryExecutionIdsSelector = (state: IStoreState) =>
    state.queryView.queryExecutionIds;

export const queryExecutionResultSelector = createSelector(
    queryExecutionIdsSelector,
    queryExecutionByIdSelector,
    queryEngineByIdEnvSelector,
    (queryExecutionIds, queryExecutionById, queryEngineById) =>
        queryExecutionIds
            .filter((id) => id in queryExecutionById)
            .map((id) => queryExecutionById[id])
            .filter((execution) => execution.engine_id in queryEngineById)
);
