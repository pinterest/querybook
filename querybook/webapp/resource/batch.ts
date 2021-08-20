import type { IQueryExecution, IRawQueryExecution } from 'const/queryExecution';
import type { IUserInfo } from 'const/user';
import ds from 'lib/datasource';

export const BatchResource = {
    getExecutionsOfCells: (cellIds: number[]) =>
        ds.save<
            Array<
                [
                    cellId: number,
                    executions: IQueryExecution[],
                    latestExecution: IRawQueryExecution
                ]
            >
        >(`/batch/data_cell/query_execution/`, {
            cell_ids: cellIds,
        }),
    getUsers: (userIds: number[]) =>
        ds.save<IUserInfo[]>(`/batch/user/`, {
            uids: userIds,
        }),
};
