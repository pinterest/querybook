import { bind, debounce } from 'lodash-decorators';
import React from 'react';
import { connect } from 'react-redux';

import { IQueryExecution, QueryExecutionStatus } from 'const/queryExecution';
import {
    queryEngineByIdEnvSelector,
    queryEngineSelector,
} from 'redux/queryEngine/selector';
import * as queryExecutionsActions from 'redux/queryExecutions/action';
import * as queryViewActions from 'redux/queryView/action';
import { queryExecutionResultSelector } from 'redux/queryView/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Icon } from 'ui/Icon/Icon';
import { AccentText } from 'ui/StyledText/StyledText';

import { QueryResult } from './QueryResult';
import { QueryViewFilter } from './QueryViewFilter';

import './QueryViewNavigator.scss';

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;

export type IProps = StateProps & DispatchProps;

class QueryViewNavigatorComponent extends React.PureComponent<IProps> {
    private navigatorScrollRef = React.createRef<HTMLDivElement>();

    public constructor(props) {
        super(props);

        this.state = {
            showQueryViewModalForId: null,
        };
    }

    @bind
    public setupPolling(queryExecutions: IQueryExecution[]) {
        for (const queryExecution of queryExecutions) {
            if (queryExecution.status < QueryExecutionStatus.DONE) {
                this.props.pollQueryExecution(queryExecution.id);
            }
        }
    }

    @bind
    public onNavigatorScroll(event) {
        if (event.target === this.navigatorScrollRef.current) {
            this.loadMoreIfScrolledToBottom();
        }
    }

    @bind
    @debounce(500)
    public loadMoreIfScrolledToBottom() {
        const { isLoadingQueries, loadQueries } = this.props;

        if (!isLoadingQueries && this.navigatorScrollRef) {
            const el = this.navigatorScrollRef.current;
            if (el.scrollHeight - el.scrollTop === el.clientHeight) {
                // Scrolled to bottom
                loadQueries();
            }
        }
    }

    public componentDidMount() {
        this.props.initializeFromQueryParam();
        this.setupPolling(this.props.queryResults);
    }

    public componentDidUpdate(prevProps) {
        if (this.props.queryResults !== prevProps.queryResults) {
            this.setupPolling(this.props.queryResults);
        }
    }

    public render() {
        const {
            queryResults,
            isLoadingQueries,
            queryViewFilters,
            queryEngines,
            queryEngineById,

            initializeFromQueryParam,
            updateFilter,
        } = this.props;

        const queryViewFilterDOM = (
            <QueryViewFilter
                filters={queryViewFilters}
                updateFilter={updateFilter}
                onRefresh={initializeFromQueryParam}
                queryEngines={queryEngines}
                queryEngineById={queryEngineById}
            />
        );

        const queryResultsListDOM = queryResults.map((queryResult) => (
            <QueryResult
                key={queryResult.id}
                queryExecution={queryResult}
                queryEngineById={queryEngineById}
            />
        ));

        const loadingDOM = isLoadingQueries ? (
            <div className="flex-column m24">
                <Icon name="Loading" className="mb16" />
                <AccentText color="light" weight="bold">
                    Loading Executions
                </AccentText>
            </div>
        ) : null;

        const noResultDOM =
            queryResults.length === 0 && !loadingDOM ? (
                <div className="empty-section-message">No Executions</div>
            ) : null;

        return (
            <div className="QueryViewNavigator SidebarNavigator">
                <div className="list-header">{queryViewFilterDOM}</div>
                <div
                    ref={this.navigatorScrollRef}
                    className="list-content scroll-wrapper"
                    onScroll={this.onNavigatorScroll}
                >
                    {queryResultsListDOM}
                    {loadingDOM}
                    {noResultDOM}
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state: IStoreState) => ({
    queryResults: queryExecutionResultSelector(state),
    isLoadingQueries: state.queryView.isLoading,
    queryViewFilters: state.queryView.filters,
    queryEngines: queryEngineSelector(state),
    queryEngineById: queryEngineByIdEnvSelector(state),
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    updateFilter: (filterKey: string, filterValue: any) => {
        dispatch(queryViewActions.updateFilter(filterKey, filterValue));
    },

    initializeFromQueryParam: () =>
        dispatch(queryViewActions.mapQueryParamToState()),

    loadQueries: () => dispatch(queryViewActions.searchQueries()),

    pollQueryExecution: (queryExecutionId) => {
        dispatch(queryExecutionsActions.pollQueryExecution(queryExecutionId));
    },
});

export const QueryViewNavigator = connect(
    mapStateToProps,
    mapDispatchToProps
)(QueryViewNavigatorComponent);
