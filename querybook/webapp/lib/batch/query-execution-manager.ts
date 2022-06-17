import { BatchManager, mergeSetFunction } from 'lib/batch/batch-manager';
import {
    receiveQueryExecution,
    receiveQueryExecutionsByCell,
} from 'redux/queryExecutions/action';
import { Dispatch } from 'redux/store/types';
import { BatchResource } from 'resource/batch';

class QueryCellExecutionManager {
    private dispatch: Dispatch;
    private batchLoadUserManager = new BatchManager<number, number[]>({
        batchFrequency: 500,
        processFunction: async (cellIds: number[]) => {
            const { data: cellExecutions } =
                await BatchResource.getExecutionsOfCells(cellIds);

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
