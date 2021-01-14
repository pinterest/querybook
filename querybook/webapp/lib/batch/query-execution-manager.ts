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

            for (const [
                cellId,
                executions,
                latestExecution,
            ] of cellExecutions) {
                if (executions) {
                    this.dispatch(
                        receiveQueryExecutionsByCell(executions, cellId)
                    );
                    if (latestExecution) {
                        this.dispatch(receiveQueryExecution(latestExecution));
                    }
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
export const queryCellExecutionManager = new QueryCellExecutionManager();
