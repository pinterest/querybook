import { DataDocScheduleResource } from 'resource/dataDoc';

import { IScheduledDoc, IScheduledDocFilters, ThunkResult } from './types';

export function getScheduledDocs({
    paginationPage,
    paginationPageSize,
    paginationFilter,
}: {
    paginationPage?: number;
    paginationPageSize?: number;
    paginationFilter?: IScheduledDocFilters;
}): ThunkResult<Promise<IScheduledDoc[]>> {
    return async (dispatch, getState) => {
        const envId = getState().environment.currentEnvironmentId;
        const scheduledDocsState = getState().scheduledDocs;

        const page = paginationPage ?? scheduledDocsState.page;
        const filters = paginationFilter ?? scheduledDocsState.filters;
        const pageSize = paginationPageSize ?? scheduledDocsState.pageSize;

        const {
            data: { docs, count },
        } = await DataDocScheduleResource.getAll({
            envId,
            limit: pageSize,
            offset: page * pageSize,
            filters,
        });

        dispatch({
            type: '@@scheduledDataDoc/RECEIVE_DOC_WITH_SCHEMA',
            payload: {
                docs,
                page,
                pageSize,
                total: count,
                filters,
            },
        });

        return docs;
    };
}
