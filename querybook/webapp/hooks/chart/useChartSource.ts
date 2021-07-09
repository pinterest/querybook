import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { useMakeSelector } from 'hooks/redux/useMakeSelector';
import ds from 'lib/datasource';
import { IStoreState, Dispatch } from 'redux/store/types';
import { StatementExecutionStatus } from 'const/queryExecution';
import * as queryExecutionsSelector from 'redux/queryExecutions/selector';
import * as queryExecutionsActions from 'redux/queryExecutions/action';

export function useChartSource(
    cellId: number,
    executionId: number,
    statementId: number,
    setCellId: (cellId: number) => any,
    setExecutionId: (executionId: number) => any,
    setStatementId: (statementId: number) => any
) {
    const [initializingExecutionId, setInitializingExecutionId] = useState(
        false
    );
    const executionIdList = useSelector((state: IStoreState) =>
        queryExecutionsSelector.dataCellIdQueryExecutionArraySelector(
            state,
            cellId
        )
    );
    const statementIdList = useMakeSelector(
        queryExecutionsSelector.makeQueryExecutionStatementExecutionSelector,
        executionId
    );

    const statementResultData = useSelector(
        (state: IStoreState) =>
            state.queryExecutions.statementResultById[statementId]?.data
    );

    const dispatch: Dispatch = useDispatch();
    const getCellQueryExecutions = React.useCallback(
        (dataCellId) =>
            dispatch(
                queryExecutionsActions.fetchQueryExecutionsByCell(dataCellId)
            ),
        []
    );
    const loadQueryExecutionIfNeeded = React.useCallback(
        (queryExecutionId) =>
            dispatch(
                queryExecutionsActions.fetchQueryExecutionIfNeeded(
                    queryExecutionId
                )
            ),
        []
    );
    const loadStatementResult = React.useCallback(
        (statementExecutionId: number) =>
            dispatch(queryExecutionsActions.fetchResult(statementExecutionId)),
        []
    );

    const { queryExecutionById, statementExecutionById } = useSelector(
        (state: IStoreState) => ({
            queryExecutionById: state.queryExecutions.queryExecutionById,
            statementExecutionById:
                state.queryExecutions.statementExecutionById,
        })
    );

    React.useEffect(() => {
        if (cellId == null && executionId) {
            setInitializingExecutionId(true);
            ds.fetch(`/query_execution/${executionId}/datadoc_cell_info/`).then(
                (resp) => {
                    setCellId(resp.data.cell_id);
                }
            );
        } else if (executionId == null && executionIdList?.length) {
            setExecutionId(executionIdList[0]);
        }
        if (cellId) {
            getCellQueryExecutions(cellId);
        } else if (cellId == null && executionId) {
            dispatch(
                queryExecutionsActions.fetchDataDocInfoByQueryExecutionId(
                    executionId
                )
            ).then(({ cell_id: newCellId }) => {
                setCellId(newCellId);
            });
        }
    }, []);

    React.useEffect(() => {
        if (cellId) {
            if (initializingExecutionId) {
                setInitializingExecutionId(false);
            } else {
                setExecutionId(undefined);
            }
            setStatementId(undefined);
            getCellQueryExecutions(cellId);
        }
    }, [cellId]);

    React.useEffect(() => {
        if (executionId == null && executionIdList) {
            setExecutionId(executionIdList[0]);
        }
    }, [executionId, executionIdList]);

    React.useEffect(() => {
        setStatementId(undefined);
        if (executionId != null) {
            loadQueryExecutionIfNeeded(executionId);
        }
    }, [executionId]);

    React.useEffect(() => {
        if (statementId == null && statementIdList) {
            setStatementId(statementIdList[0]);
        }
    }, [statementId, statementIdList]);

    React.useEffect(() => {
        if (statementId != null) {
            loadStatementResult(statementId);
        }
    }, [statementId]);

    const queryExecutions = React.useMemo(
        () =>
            (executionIdList || [])
                .map((id) => queryExecutionById[id])
                .filter((queryExecution) => queryExecution),
        [queryExecutionById, executionIdList]
    );

    const statementExecutions = React.useMemo(
        () =>
            (statementIdList || [])
                .map((sid) => statementExecutionById[sid])
                .filter(
                    (statementExecution) =>
                        statementExecution.status ===
                            StatementExecutionStatus.DONE &&
                        statementExecution.result_row_count > 0
                ),
        [statementIdList, statementExecutionById]
    );

    return {
        statementResultData,
        queryExecutions,
        statementExecutions,
    };
}
