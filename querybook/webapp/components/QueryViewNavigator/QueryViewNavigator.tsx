import { debounce } from 'lodash';
import React, { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { IQueryExecution, QueryExecutionStatus } from 'const/queryExecution';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import {
    queryEngineByIdEnvSelector,
    queryEngineSelector,
} from 'redux/queryEngine/selector';
import * as queryExecutionsActions from 'redux/queryExecutions/action';
import * as queryViewActions from 'redux/queryView/action';
import { queryExecutionResultSelector } from 'redux/queryView/selector';
import { IStoreState } from 'redux/store/types';
import { Icon } from 'ui/Icon/Icon';
import { AccentText } from 'ui/StyledText/StyledText';

import { QueryResult } from './QueryResult';
import { QueryViewFilter } from './QueryViewFilter';

import './QueryViewNavigator.scss';

export const QueryViewNavigator: React.FC = () => {
    const {
        queryResults,
        isLoadingQueries,
        queryViewFilters,
        queryEngines,
        queryEngineById,
    } = useShallowSelector((state: IStoreState) => ({
        queryResults: queryExecutionResultSelector(state),
        isLoadingQueries: state.queryView.isLoading,
        queryViewFilters: state.queryView.filters,
        queryEngines: queryEngineSelector(state),
        queryEngineById: queryEngineByIdEnvSelector(state),
    }));

    const dispatch = useDispatch();
    const updateFilter = useCallback(
        (filterKey: string, filterValue: any) => {
            dispatch(queryViewActions.updateFilter(filterKey, filterValue));
        },
        [dispatch]
    );

    const initializeFromQueryParam = useCallback(
        () => dispatch(queryViewActions.mapQueryParamToState()),
        [dispatch]
    );

    const loadQueries = useCallback(
        () => dispatch(queryViewActions.searchQueries()),
        [dispatch]
    );

    const pollQueryExecution = useCallback(
        (queryExecutionId: number) => {
            dispatch(
                queryExecutionsActions.pollQueryExecution(queryExecutionId)
            );
        },
        [dispatch]
    );

    const navigatorScrollRef = useRef<HTMLDivElement>();

    const setupPolling = useCallback(
        (queryExecutions: IQueryExecution[]) => {
            for (const queryExecution of queryExecutions) {
                if (queryExecution.status < QueryExecutionStatus.DONE) {
                    pollQueryExecution(queryExecution.id);
                }
            }
        },
        [pollQueryExecution]
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const loadMoreIfScrolledToBottom = useCallback(
        debounce(() => {
            if (!isLoadingQueries && navigatorScrollRef) {
                const el = navigatorScrollRef.current;
                if (el.scrollHeight - el.scrollTop === el.clientHeight) {
                    // Scrolled to bottom
                    loadQueries();
                }
            }
        }, 500),
        [loadQueries, isLoadingQueries]
    );

    const handleNavigatorScroll = useCallback(
        (event) => {
            if (event.target === navigatorScrollRef.current) {
                loadMoreIfScrolledToBottom();
            }
        },
        [loadMoreIfScrolledToBottom]
    );

    useEffect(() => {
        initializeFromQueryParam();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setupPolling(queryResults);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryResults]);

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
                ref={navigatorScrollRef}
                className="list-content scroll-wrapper"
                onScroll={handleNavigatorScroll}
            >
                {queryResultsListDOM}
                {loadingDOM}
                {noResultDOM}
            </div>
        </div>
    );
};
