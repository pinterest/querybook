import { ThunkResult, IScheduledDoc } from './types';
import { TaskScheduleResource } from 'resource/taskSchedule';

export function getScheduledDocs({
    paginationPage,
    paginationPageSize,
    paginationFilter,
}: {
    paginationPage?: number;
    paginationPageSize?: number;
    paginationFilter?: string;
}): ThunkResult<Promise<IScheduledDoc[]>> {
    return async (dispatch, getState) => {
        const envId = getState().environment.currentEnvironmentId;
        const scheduledDocs = getState().scheduledDocs;
        const page = paginationPage ?? scheduledDocs.page;
        const filtered = paginationFilter ?? scheduledDocs.filtered;
        const pageSize = paginationPageSize ?? scheduledDocs.pageSize;
        const {
            data: { docs, count },
        } = await TaskScheduleResource.getTasksWithSchedule({
            envId,
            limit: pageSize,
            offset: page * pageSize,
            filtered_title: filtered,
        });

        dispatch({
            type: '@@dataDoc/RECEIVE_DATA_WITH_SCHEMA',
            payload: {
                docs,
                page,
                pageSize,
                total: count,
                filtered,
            },
        });

        return docs;
    };
}
