import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';

import { DataDocStatementExecution } from 'components/DataDocStatementExecution/DataDocStatementExecution';
import { StatementExecutionPicker } from 'components/ExecutionPicker/StatementExecutionPicker';
import { StatementExecutionBar } from 'components/StatementExecutionBar/StatementExecutionBar';
import { QueryExecutionStatus } from 'const/queryExecution';
import { useMakeSelector } from 'hooks/redux/useMakeSelector';
import { useToggleState } from 'hooks/useToggleState';
import { canCurrentUserEditSelector } from 'redux/dataDoc/selector';
import * as queryExecutionsActions from 'redux/queryExecutions/action';
import {
    makeStatementExecutionsSelector,
    queryExecutionSelector,
} from 'redux/queryExecutions/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { QueryExecutionResource } from 'resource/queryExecution';
import { Loader } from 'ui/Loader/Loader';
import { Loading } from 'ui/Loading/Loading';

import { ExecutedQueryCell } from './ExecutedQueryCell';
import { QueryErrorWrapper } from './QueryError';
import { QuerySteps } from './QuerySteps';
import { SamplingTooltip } from './SamplingToolTip';

import './QueryExecution.scss';

interface IProps {
    id: number;
    docId?: number;
    changeCellContext?: (context: string, run: boolean) => void;

    onSamplingInfoClick?: () => void;
    hasSamplingTables?: boolean;
    sampleRate?: number;
}

function useQueryExecutionReduxState(queryId: number) {
    const queryExecution = useSelector((state: IStoreState) =>
        queryExecutionSelector(state, queryId)
    );
    const statementExecutions = useMakeSelector(
        makeStatementExecutionsSelector,
        queryId
    );

    return {
        queryExecution,
        statementExecutions,
    };
}

function useQueryExecutionDispatch(queryExecutionId: number) {
    const dispatch: Dispatch = useDispatch();
    const loadQueryExecutionIfNeeded = useCallback(() => {
        dispatch(
            queryExecutionsActions.fetchQueryExecutionIfNeeded(queryExecutionId)
        );
    }, [queryExecutionId]);

    const pollQueryExecution = useCallback(
        (docId?: number) =>
            dispatch(
                queryExecutionsActions.pollQueryExecution(
                    queryExecutionId,
                    docId
                )
            ),
        [queryExecutionId]
    );

    const cancelQueryExecution = useCallback(
        () =>
            QueryExecutionResource.cancel(queryExecutionId).then(() => {
                toast(
                    'Cancelled! Please be patient as the cancellation takes some time.'
                );
            }),
        [queryExecutionId]
    );
    return {
        loadQueryExecutionIfNeeded,
        pollQueryExecution,
        cancelQueryExecution,
    };
}

export const QueryExecution: React.FC<IProps> = ({
    id,
    docId,
    changeCellContext,

    onSamplingInfoClick,
    hasSamplingTables,
    sampleRate,
}) => {
    const isEditable = useSelector((state: IStoreState) =>
        canCurrentUserEditSelector(state, docId)
    );

    const [statementIndex, setStatementIndex] = useState(0);
    const [showExecutedQuery, , toggleShowExecutedQuery] =
        useToggleState(false);
    const [showStatementLogs, , toggleLogs] = useToggleState(false);
    const [showStatementMeta, , toggleShowStatementMeta] =
        useToggleState(false);

    const { queryExecution, statementExecutions } =
        useQueryExecutionReduxState(id);

    const statementExecution = useMemo(
        () => statementExecutions?.[statementIndex],
        [statementExecutions, statementIndex]
    );

    const {
        loadQueryExecutionIfNeeded,
        pollQueryExecution,
        cancelQueryExecution,
    } = useQueryExecutionDispatch(id);

    const selectStatementId = useCallback(
        (statementId: number) => {
            const { statement_executions: statementExecutionIds } =
                queryExecution;
            setStatementIndex(
                Math.max(statementExecutionIds.indexOf(statementId), 0)
            );
        },
        [queryExecution]
    );

    useEffect(() => {
        if (queryExecution?.status <= QueryExecutionStatus.RUNNING) {
            pollQueryExecution(docId);
        }
    }, [queryExecution?.status]);

    const getQueryExecutionDOM = () => {
        const { statement_executions: statementExecutionIds } = queryExecution;
        const queryStepsDOM = <QuerySteps queryExecution={queryExecution} />;

        const samplingToolTipDOM = (
            <SamplingTooltip
                queryExecution={queryExecution}
                onSamplingInfoClick={onSamplingInfoClick}
                hasSamplingTables={hasSamplingTables}
                sampleRate={sampleRate}
            />
        );

        if (
            statementExecutionIds == null ||
            queryExecution.status === QueryExecutionStatus.INITIALIZED
        ) {
            return (
                <div className="QueryExecution ">
                    {queryStepsDOM}
                    {samplingToolTipDOM}
                </div>
            );
        }
        const statementExecutionId = statementExecution
            ? statementExecution.id
            : null;
        const statementExecutionDOM = statementExecution ? (
            <DataDocStatementExecution
                key={statementExecutionId}
                statementExecution={statementExecution}
                showStatementMeta={showStatementMeta}
                showStatementLogs={showStatementLogs}
                toggleStatementMeta={toggleShowStatementMeta}
                queryExecutionId={id}
            />
        ) : queryExecution.status <= QueryExecutionStatus.RUNNING ? (
            <Loading />
        ) : null;

        const executedQueryDOM = showExecutedQuery ? (
            <ExecutedQueryCell
                queryExecution={queryExecution}
                highlightRange={
                    statementExecution && {
                        from: statementExecution.statement_range_start,
                        to: statementExecution.statement_range_end,
                    }
                }
                changeCellContext={changeCellContext}
            />
        ) : null;

        return (
            <div className="QueryExecution ">
                <div className="execution-wrapper">
                    {queryStepsDOM}
                    {samplingToolTipDOM}
                    {getQueryExecutionErrorDOM()}
                    {getStatementExecutionHeaderDOM()}
                    {executedQueryDOM}
                    <div className="query-execution-content">
                        {statementExecutionDOM}
                    </div>
                </div>
            </div>
        );
    };

    const getStatementExecutionHeaderDOM = () => {
        const { status: queryStatus } = queryExecution;

        const statementExecutionBar = statementExecution ? (
            <StatementExecutionBar
                queryStatus={queryStatus}
                statementExecution={statementExecution}
                showStatementLogs={showStatementLogs}
                showExecutedQuery={showExecutedQuery}
                showStatementMeta={showStatementMeta}
                cancelQueryExecution={cancelQueryExecution}
                toggleShowExecutedQuery={toggleShowExecutedQuery}
                toggleLogs={toggleLogs}
                toggleShowStatementMeta={toggleShowStatementMeta}
            />
        ) : null;

        const statementTab = (
            <StatementExecutionPicker
                statementExecutionId={
                    statementExecution ? statementExecution.id : null
                }
                statementExecutions={statementExecutions}
                onSelection={selectStatementId}
                total={queryExecution.total}
                autoSelect
            />
        );

        return (
            <div className="statement-header horizontal-space-between">
                <div className="statement-header-top">
                    <div className="run-header-left">{statementTab}</div>
                </div>
                <div className="statement-header-bottom">
                    {statementExecutionBar}
                </div>
            </div>
        );
    };

    const getQueryExecutionErrorDOM = () => {
        if (queryExecution.status === QueryExecutionStatus.ERROR) {
            return (
                <QueryErrorWrapper
                    queryExecution={queryExecution}
                    statementExecutions={statementExecutions}
                    readonly={!isEditable}
                    changeCellContext={changeCellContext}
                />
            );
        }
    };

    return (
        <Loader
            item={queryExecution && queryExecution.statement_executions}
            itemKey={id}
            itemLoader={loadQueryExecutionIfNeeded.bind(null, id)}
            renderer={getQueryExecutionDOM}
        />
    );
};
