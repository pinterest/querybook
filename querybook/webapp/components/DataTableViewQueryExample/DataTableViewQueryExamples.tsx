import { isEmpty } from 'lodash';
import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { UserName } from 'components/UserBadge/UserName';
import { IPaginatedQuerySampleFilters } from 'const/metastore';
import { useImmer } from 'hooks/useImmer';
import { useLoader } from 'hooks/useLoader';
import { format } from 'lib/sql-helper/sql-formatter';
import {
    getQueryString,
    navigateWithinEnv,
    replaceQueryString,
} from 'lib/utils/query-string';
import * as dataSourcesActions from 'redux/dataSources/action';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';
import * as queryExecutionsActions from 'redux/queryExecutions/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button, TextButton } from 'ui/Button/Button';
import { ThemedCodeHighlight } from 'ui/CodeHighlight/ThemedCodeHighlight';
import { Loading } from 'ui/Loading/Loading';
import { AccentText } from 'ui/StyledText/StyledText';

import { DataTableViewQueryConcurrences } from './DataTableViewQueryConcurrences';
import { DataTableViewQueryEngines } from './DataTableViewQueryEngines';
import { DataTableViewQueryUsers } from './DataTableViewQueryUsers';

import './DataTableViewQueryExamples.scss';

interface IProps {
    tableId: number;
}

function useQueryExampleState(tableId: number) {
    const queryExecutionById = useSelector(
        (state: IStoreState) => state.queryExecutions.queryExecutionById
    );
    const queryExampleIdsState = useSelector(
        (state: IStoreState) => state.dataSources.queryExampleIdsById[tableId]
    );
    return React.useMemo(
        () => ({
            queryExampleIds: queryExampleIdsState?.queryIds,

            hasMore: queryExampleIdsState?.hasMore ?? true,
            queryExamplesIdsToLoad: (
                queryExampleIdsState?.queryIds ?? []
            ).filter((id) => !(id in queryExecutionById)),
            queryExamples: (queryExampleIdsState?.queryIds ?? [])
                .map((id) => queryExecutionById[id])
                .filter((query) => query),
        }),
        [queryExampleIdsState, queryExecutionById]
    );
}

function getInitialFilterState(): IPaginatedQuerySampleFilters {
    const queryString = getQueryString();
    const uid: string = queryString['uid'];
    const engineId: string = queryString['engine_id'];
    const withTableId: string = queryString['with_table_id'];
    const filters: IPaginatedQuerySampleFilters = {};

    if (uid) {
        filters.uid = Number(uid);
    }
    if (engineId) {
        filters.engine_id = Number(engineId);
    }
    if (withTableId) {
        filters.with_table_id = Number(withTableId);
    }
    return filters;
}

function syncFilterStateToQueryString(filters: IPaginatedQuerySampleFilters) {
    replaceQueryString(filters, false);
}

function useFilterState() {
    const [filters, setFilters] = useImmer<IPaginatedQuerySampleFilters>(
        getInitialFilterState()
    );

    const setFilter = React.useCallback(
        <K extends keyof IPaginatedQuerySampleFilters>(
            filterKey: K,
            filterVal?: IPaginatedQuerySampleFilters[K]
        ) => {
            setFilters((draft) => {
                if (filterVal == null) {
                    delete draft[filterKey];
                } else {
                    draft[filterKey] = filterVal;
                }
                syncFilterStateToQueryString(draft);
            });
        },
        []
    );

    const clearFilter = React.useCallback(() => {
        setFilters(() => ({}));
        syncFilterStateToQueryString({});
    }, []);

    return [filters, setFilter, clearFilter] as const;
}

export const DataTableViewQueryExamples: React.FunctionComponent<IProps> = ({
    tableId,
}) => {
    const [filters, setFilter, clearFilter] = useFilterState();

    const setUidFilter = React.useCallback(
        (uid: number) => {
            setFilter('uid', uid === filters.uid ? null : uid);
        },
        [filters]
    );

    const setEngineIdFilter = React.useCallback(
        (engineId: number) => {
            setFilter(
                'engine_id',
                engineId === filters.engine_id ? null : engineId
            );
        },
        [filters]
    );

    const setTableIdFilter = React.useCallback(
        (tableId: number) => {
            setFilter(
                'with_table_id',
                tableId === filters.with_table_id ? null : tableId
            );
        },
        [filters]
    );

    const queryExampleFiltersSection = (
        <div className="mb12">
            <div className="horizontal-space-between">
                <AccentText
                    className="mb12"
                    size="text"
                    color="light"
                    noUserSelect
                >
                    Select any user, query engine, and/or co-occuring tables to
                    filter
                </AccentText>
                {!isEmpty(filters) && (
                    <Button onClick={clearFilter}>Clear Filter</Button>
                )}
            </div>
            <div className="filter-selection-section mb24">
                <div className="mb8">
                    <AccentText size="med" color="text" weight="bold">
                        Top users
                    </AccentText>
                    <DataTableViewQueryUsers
                        tableId={tableId}
                        onClick={setUidFilter}
                        selectedUid={filters.uid}
                    />
                </div>
                <div className="mb8">
                    <AccentText size="med" color="text" weight="bold">
                        Query engines
                    </AccentText>
                    <DataTableViewQueryEngines
                        tableId={tableId}
                        onClick={setEngineIdFilter}
                        selectedEngineId={filters.engine_id}
                    />
                </div>
                <div className="mb8">
                    <AccentText size="med" color="text" weight="bold">
                        Top co-occurring tables
                    </AccentText>
                    <DataTableViewQueryConcurrences
                        tableId={tableId}
                        onClick={setTableIdFilter}
                        selectedTableId={filters.with_table_id}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="DataTableViewQueryExamples pb24">
            {queryExampleFiltersSection}
            <QueryExamplesList tableId={tableId} filters={filters} />
        </div>
    );
};

const QueryExamplesList: React.FC<{
    tableId: number;
    filters: IPaginatedQuerySampleFilters;
}> = ({ tableId, filters }) => {
    const dispatch: Dispatch = useDispatch();
    const [loadingQueryExecution, setLoadingQueryExecution] =
        React.useState(false);

    const queryEngineById = useSelector(queryEngineByIdEnvSelector);
    const {
        queryExampleIds,
        hasMore,

        queryExamples,
        queryExamplesIdsToLoad,
    } = useQueryExampleState(tableId);

    const loadMoreQueryExampleIds = React.useCallback(
        () => dispatch(dataSourcesActions.fetchMoreQueryExampleIds(tableId)),
        [tableId]
    );

    const loadQueryExecution = React.useCallback(
        (queryExecutionId) =>
            dispatch(
                queryExecutionsActions.fetchQueryExecutionIfNeeded(
                    queryExecutionId
                )
            ),
        []
    );

    const { loading: loadingInitial } = useLoader({
        item: queryExampleIds,
        itemLoader: () =>
            dispatch(
                dataSourcesActions.fetchQueryExampleIdsIfNeeded(
                    tableId,
                    filters
                )
            ),
    });

    React.useEffect(() => {
        if (!loadingInitial) {
            dispatch(
                dataSourcesActions.fetchQueryExampleIdsIfNeeded(
                    tableId,
                    filters
                )
            );
        }
    }, [filters]);

    React.useEffect(() => {
        setLoadingQueryExecution(true);
        Promise.all(queryExamplesIdsToLoad.map(loadQueryExecution)).finally(
            () => setLoadingQueryExecution(false)
        );
    }, [queryExampleIds]);

    const openDisplayModal = (queryId: number) => {
        navigateWithinEnv(`/query_execution/${queryId}/`, {
            isModal: true,
        });
    };

    const getExampleDOM = () => {
        if (loadingInitial) {
            return <Loading />;
        }

        const queryExamplesDOM = queryExamples
            .map((query) => {
                const language =
                    queryEngineById[query.engine_id]?.language ?? 'presto';
                const formattedQuery = format(query.query, language, {
                    case: 'upper',
                });
                return (
                    <div
                        className="DataTableViewQueryExamples-item"
                        key={query.id}
                    >
                        <ThemedCodeHighlight
                            className="DataTableViewQueryExamples-query"
                            value={formattedQuery}
                        />
                        <div className="DataTableViewQueryExamples-info">
                            <span>by </span>
                            <UserName uid={query.uid} />
                        </div>
                        <TextButton
                            icon="ArrowRight"
                            title="Open Execution"
                            className="mt8"
                            onClick={() => openDisplayModal(query.id)}
                        />
                    </div>
                );
            })
            .concat(loadingQueryExecution ? [<Loading key="loading" />] : []);
        return <div>{queryExamplesDOM}</div>;
    };

    return (
        <div>
            {getExampleDOM()}
            <div className="center-align">
                {hasMore && !loadingInitial && (
                    <AsyncButton
                        onClick={loadMoreQueryExampleIds}
                        title="Show More"
                    />
                )}
            </div>
        </div>
    );
};
