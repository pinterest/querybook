import { IDataCell } from 'const/datadoc';
import { IQueryExecution, IStatementExecution } from 'const/queryExecution';
import ds from 'lib/datasource';

export type IRawQueryExecution = IQueryExecution & {
    statement_executions: IStatementExecution[];
    data_cell: IDataCell;
};

export const QueryViewResource = {
    search: (
        envId: number,
        params: {
            filters?: {
                user?: number;
            };
            orderBy?: string;
            offset?: number;
        }
    ) =>
        ds.fetch<IRawQueryExecution[]>('/query_execution/search/', {
            ...params,
            environment_id: envId,
        }),
};
