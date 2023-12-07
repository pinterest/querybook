import { DataDocScheduleResource } from 'resource/dataDoc';
import { IOption } from 'lib/utils/react-select';

import { IScheduledDoc, IScheduledDocFilters, ThunkResult } from './types';
import { StatusType } from 'const/schedFiltersType';

function reformatBoardIds(boardIds: Array<IOption<number>>): number[] | null {
    if (boardIds.length) {
        return boardIds.map((board) => board.value);
    }

    return null;
}

function reformatStatus(status: StatusType): boolean | null {
    if (status === 'all') {
        return null;
    }

    return status === 'enabled';
}

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
            filters: {
                ...filters,
                status: reformatStatus(filters.status),
                board_ids: reformatBoardIds(filters.board_ids),
            },
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
