import { bind } from 'lodash-decorators';
import { decorate } from 'core-decorators';
import memoizeOne from 'memoize-one';
import React from 'react';
import { connect } from 'react-redux';

import { sendNotification } from 'lib/globalUI';
import { QueryExecutionStatus } from 'const/queryExecution';
import { IQueryExecution } from 'redux/queryExecutions/types';
import * as queryExecutionsActions from 'redux/queryExecutions/action';
import { IStoreState, Dispatch } from 'redux/store/types';

import { DataDocStatementExecutionBar } from 'components/DataDocStatementExecutionBar/DataDocStatementExecutionBar';
import { DataDocStatementExecution } from 'components/DataDocStatementExecution/DataDocStatementExecution';
import { StatementExecutionPicker } from 'components/ExecutionPicker/StatementExecutionPicker';

import { Loader } from 'ui/Loader/Loader';
import { Loading } from 'ui/Loading/Loading';

import { ExecutedQueryCell } from './ExecutedQueryCell';
import { QueryErrorWrapper } from './QueryError';
import { QuerySteps } from './QuerySteps';
import './QueryExecution.scss';
import { QueryExecutionFooter } from './QueryExecutionFooter';
import {
    queryExecutionSelector,
    statementExecutionsSelector,
} from 'redux/queryExecutions/selector';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';

interface IOwnProps {
    id: number;
    docId?: number;
    changeCellContext?: (context: string) => any;
}
type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;
type IProps = IOwnProps & StateProps & DispatchProps;

interface IState {
    selectedStatementTabIndex: number;
    showExecutedQuery: boolean;
    showStatementLogs: boolean;
    showStatementMeta: boolean;
}

class QueryExecutionComponent extends React.Component<IProps, IState> {
    public readonly state = {
        selectedStatementTabIndex: 0,
        showExecutedQuery: false,
        showStatementLogs: false,
        showStatementMeta: false,
    };

    @decorate(memoizeOne)
    public pollQueryExecution(queryExecution: IQueryExecution) {
        if (
            queryExecution &&
            queryExecution.status <= QueryExecutionStatus.RUNNING
        ) {
            this.props.pollQueryExecution(queryExecution.id, this.props.docId);
        }
    }

    @bind
    public selectStatementTabIndex(index: number) {
        this.setState({
            selectedStatementTabIndex: index,
        });
    }

    @bind
    public selectStatementId(id: number) {
        const {
            queryExecution: { statement_executions: statementExecutionIds },
        } = this.props;

        this.selectStatementTabIndex(
            Math.max(statementExecutionIds.indexOf(id), 0)
        );
    }

    @bind
    public getStatementExecution() {
        return this.props.statementExecutions[
            this.state.selectedStatementTabIndex
        ];
    }

    @bind
    public toggleShowExecutedQuery() {
        this.setState({
            showExecutedQuery: !this.state.showExecutedQuery,
        });
    }

    @bind
    public toggleShowStatementMeta() {
        this.setState(({ showStatementMeta }) => ({
            showStatementMeta: !showStatementMeta,
        }));
    }

    @bind
    public toggleLogs() {
        const showStatementLogs = !this.state.showStatementLogs;
        this.setState({ showStatementLogs });
    }

    @bind
    public renderQueryExecution() {
        const {
            queryExecution,
            statementResultById,

            loadS3Result,

            changeCellContext,
        } = this.props;
        const {
            selectedStatementTabIndex,
            showExecutedQuery,
            showStatementMeta,
        } = this.state;
        const { statement_executions: statementExecutionIds } = queryExecution;

        const queryStepsDOM = <QuerySteps queryExecution={queryExecution} />;
        if (
            statementExecutionIds == null ||
            queryExecution.status === QueryExecutionStatus.INITIALIZED
        ) {
            return <div className="QueryExecution ">{queryStepsDOM}</div>;
        }

        const statementExecution = this.getStatementExecution();
        const statementExecutionId = statementExecution
            ? statementExecution.id
            : null;
        const statementExecutionDOM = statementExecution ? (
            <DataDocStatementExecution
                key={statementExecutionId}
                statementExecution={statementExecution}
                statementResult={statementResultById[statementExecutionId]}
                showStatementMeta={showStatementMeta}
                loadS3Result={loadS3Result}
                index={selectedStatementTabIndex}
                showStatementLogs={this.state.showStatementLogs}
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

        const footerDOM = this.renderQueryExecutionFooter();

        return (
            <div className="QueryExecution ">
                <div className="execution-wrapper">
                    {queryStepsDOM}
                    {this.renderQueryExecutionErrorDOM()}
                    {this.renderStatementExecutionHeader()}
                    {executedQueryDOM}
                    <div className="query-execution-content">
                        {statementExecutionDOM}
                    </div>

                    {footerDOM}
                </div>
            </div>
        );
    }

    public componentDidMount() {
        this.pollQueryExecution(this.props.queryExecution);
    }

    public componentDidUpdate() {
        this.pollQueryExecution(this.props.queryExecution);
    }

    public renderStatementExecutionHeader() {
        const {
            statementExecutions,
            cancelQueryExecution,
            queryExecution,
        } = this.props;

        const {
            showExecutedQuery,
            showStatementLogs,
            showStatementMeta,
        } = this.state;

        const { id, status: queryStatus } = queryExecution;

        const statementExecution = this.getStatementExecution();

        const statementExecutionBar = statementExecution ? (
            <DataDocStatementExecutionBar
                queryStatus={queryStatus}
                statementExecution={statementExecution}
                showStatementLogs={showStatementLogs}
                showExecutedQuery={showExecutedQuery}
                showStatementMeta={showStatementMeta}
                cancelQueryExecution={cancelQueryExecution.bind(null, id)}
                toggleShowExecutedQuery={this.toggleShowExecutedQuery}
                toggleLogs={this.toggleLogs}
                toggleShowStatementMeta={this.toggleShowStatementMeta}
            />
        ) : null;

        const statementTab = (
            <StatementExecutionPicker
                statementExecutionId={
                    statementExecution ? statementExecution.id : null
                }
                statementExecutions={statementExecutions}
                onSelection={this.selectStatementId}
                total={queryExecution.total}
                autoSelect
            />
        );

        return (
            <div className="statement-header">
                <div className="statement-header-top">
                    <div className="run-header-left">{statementTab}</div>
                </div>
                <div className="statement-header-bottom">
                    {statementExecutionBar}
                </div>
            </div>
        );
    }

    public renderQueryExecutionErrorDOM() {
        const { queryExecution, statementExecutions } = this.props;

        if (queryExecution.status === QueryExecutionStatus.ERROR) {
            return (
                <QueryErrorWrapper
                    queryExecution={queryExecution}
                    statementExecutions={statementExecutions}
                />
            );
        }
    }

    public renderQueryExecutionFooter() {
        const { queryExecution, statementExecutions } = this.props;

        if (!queryExecution) {
            return;
        }

        return (
            <QueryExecutionFooter
                queryExecution={queryExecution}
                statementExecutions={statementExecutions}
            />
        );
    }

    public render() {
        const { id, queryExecution, loadQueryExecutionIfNeeded } = this.props;

        return (
            <Loader
                item={queryExecution && queryExecution.statement_executions}
                itemKey={id}
                itemLoader={loadQueryExecutionIfNeeded.bind(null, id)}
                renderer={this.renderQueryExecution}
            />
        );
    }
}

function mapStateToProps(state: IStoreState, ownProps: IOwnProps) {
    return {
        queryExecution: queryExecutionSelector(state, ownProps.id),
        statementExecutions: statementExecutionsSelector(state, ownProps.id),
        statementResultById: state.queryExecutions.statementResultById,
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        loadQueryExecutionIfNeeded: (queryExecutionId: number) => {
            dispatch(
                queryExecutionsActions.fetchQueryExecutionIfNeeded(
                    queryExecutionId
                )
            );
        },

        pollQueryExecution: (queryExecutionId: number, docId?: number) =>
            dispatch(
                queryExecutionsActions.pollQueryExecution(
                    queryExecutionId,
                    docId
                )
            ),

        loadS3Result: (statementExecutionId: number) =>
            dispatch(queryExecutionsActions.fetchResult(statementExecutionId)),

        cancelQueryExecution: (queryExecutionId: number) => {
            queryExecutionsActions
                .cancelQueryExecution(queryExecutionId)
                .then(() => {
                    sendNotification(
                        'Cancelled! Please be patient as the cancellation takes some time.'
                    );
                });
        },
    };
}

export const QueryExecution = connect(
    mapStateToProps,
    mapDispatchToProps
)(QueryExecutionComponent);
