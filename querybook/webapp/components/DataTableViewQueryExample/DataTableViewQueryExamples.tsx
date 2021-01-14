import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { format } from 'lib/sql-helper/sql-formatter';
import { getCodeEditorTheme } from 'lib/utils';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { useLoader } from 'hooks/useLoader';

import { IStoreState, Dispatch } from 'redux/store/types';
import * as dataSourcesActions from 'redux/dataSources/action';
import * as queryExecutionsActions from 'redux/queryExecutions/action';

import { DataTableViewQueryUsers } from './DataTableViewQueryUsers';
import { UserName } from 'components/UserBadge/UserName';

import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button } from 'ui/Button/Button';
import { CodeHighlight } from 'ui/CodeHighlight/CodeHighlight';
import { IconButton } from 'ui/Button/IconButton';
import { Loading } from 'ui/Loading/Loading';
import { Title } from 'ui/Title/Title';

import './DataTableViewQueryExamples.scss';

interface IProps {
    tableId: number;
    uid?: number;
}

export const DataTableViewQueryExamples: React.FunctionComponent<IProps> = ({
    tableId,
    uid = null,
}) => {
    const dispatch: Dispatch = useDispatch();
    const [loadingQueryExecution, setLoadingQueryExecution] = React.useState(
        false
    );
    const [filterUid, setFilterUid] = React.useState<number>(uid);

    const {
        queryExampleIds,
        hasMore,

        queryExamples,
        queryExamplesIdsToLoad,

        queryEngineById,
        editorTheme,
    } = useSelector((state: IStoreState) => {
        const queryExampleIdsState =
            state.dataSources.queryExampleIdsById[tableId];
        return {
            queryExampleIds: queryExampleIdsState?.queryIds,
            hasMore: queryExampleIdsState?.hasMore ?? true,
            queryExamplesIdsToLoad: (
                queryExampleIdsState?.queryIds ?? []
            ).filter((id) => !(id in state.queryExecutions.queryExecutionById)),

            queryExamples: (queryExampleIdsState?.queryIds ?? [])
                .map((id) => state.queryExecutions.queryExecutionById[id])
                .filter((query) => query),

            queryEngineById: state.queryEngine.queryEngineById,
            editorTheme: getCodeEditorTheme(state.user.computedSettings.theme),
        };
    });

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
                    filterUid
                )
            ),
    });

    React.useEffect(() => {
        if (!loadingInitial) {
            dispatch(
                dataSourcesActions.fetchQueryExampleIdsIfNeeded(
                    tableId,
                    filterUid
                )
            );
        }
    }, [filterUid]);

    React.useEffect(() => {
        setLoadingQueryExecution(true);
        Promise.all(
            queryExamplesIdsToLoad.map(loadQueryExecution)
        ).finally(() => setLoadingQueryExecution(false));
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
                        <CodeHighlight
                            className="DataTableViewQueryExamples-text"
                            language={'text/x-hive'}
                            value={formattedQuery}
                            theme={editorTheme}
                        />
                        <div className="DataTableViewQueryExamples-info">
                            <span>by </span>
                            <UserName uid={query.uid} />
                        </div>
                        <IconButton
                            icon="external-link"
                            onClick={() => openDisplayModal(query.id)}
                        />
                    </div>
                );
            })
            .concat(loadingQueryExecution ? [<Loading key="loading" />] : []);

        const titleDOM = filterUid ? (
            <div className="horizontal-space-between">
                <div className="flex-row">
                    <Title subtitle size={4}>
                        Example Queries by
                        <span className="ml8">
                            <UserName uid={filterUid} />
                        </span>
                    </Title>
                </div>
                <Button
                    onClick={() => {
                        setFilterUid(null);
                        navigateWithinEnv(
                            `/table/${tableId}/?tab=query_examples`
                        );
                    }}
                >
                    Clear User Filter
                </Button>
            </div>
        ) : (
            <Title subtitle size={4}>
                Example Queries
            </Title>
        );

        return (
            <div>
                {titleDOM}
                {queryExamplesDOM}
            </div>
        );
    };

    const topUsersSection = (
        <div className="mb12">
            <Title subtitle size={4}>
                Frequent users of this table
            </Title>
            <DataTableViewQueryUsers tableId={tableId} onClick={setFilterUid} />
        </div>
    );

    return (
        <div className="DataTableViewQueryExamples">
            {topUsersSection}
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
