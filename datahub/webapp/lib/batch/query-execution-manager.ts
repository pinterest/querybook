import ds from 'lib/datasource';
import { BatchManager, mergeSetFunction } from 'lib/batch/batch-manager';
import { Dispatch } from 'redux/store/types';
import {
    receiveQueryExecutionsByCell,
    receiveQueryExecution,
} from 'redux/queryExecutions/action';

class QueryCellExecutionManager {
    private dispatch: Dispatch;
    private batchLoadUserManager = new BatchManager<number, number[]>({
        batchFrequency: 500,
        processFunction: async (cellIds: number[]) => {
            const { data: cellExecutions } = await ds.save(
                `/batch/data_cell/query_execution/`,
                {
                    cell_ids: cellIds,
                }
            );

            for (const [cellId, executions] of cellExecutions) {
                if (executions) {
                    this.dispatch(
                        receiveQueryExecutionsByCell(executions, cellId)
                    );
                }
            }
        },
        mergeFunction: mergeSetFunction,
    });

    public loadExecutionForCell(cellId: number, dispatch: Dispatch) {
        this.dispatch = dispatch;
        return this.batchLoadUserManager.batch(cellId);
    }
}

class QueryExecutionLoadManager {
    private dispatch: Dispatch;
    private batchLoadUserManager = new BatchManager<number, number[]>({
        batchFrequency: 500,
        processFunction: async (executionIds: number[]) => {
            const { data: executions } = await ds.save(
                `/batch/query_execution/`,
                {
                    ids: executionIds,
                }
            );

            for (const execution of executions) {
                if (executions) {
                    this.dispatch(receiveQueryExecution(execution));
                }
            }
        },
        mergeFunction: mergeSetFunction,
    });

    public loadQueryExecution(executionId: number, dispatch: Dispatch) {
        this.dispatch = dispatch;
        return this.batchLoadUserManager.batch(executionId);
    }
}

export const queryCellExecutionManager = new QueryCellExecutionManager();
export const queryExecutionLoadManager = new QueryExecutionLoadManager();
