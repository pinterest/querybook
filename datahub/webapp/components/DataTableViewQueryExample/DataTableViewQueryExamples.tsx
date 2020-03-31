import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { format } from 'lib/sql-helper/sql-formatter';
import { getCodeEditorTheme } from 'lib/utils';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { useLoader } from 'hooks/useLoader';

import { IStoreState, Dispatch } from 'redux/store/types';
import * as dataSourcesActions from 'redux/dataSources/action';
import * as queryExecutionsActions from 'redux/queryExecutions/action';

import { UserName } from 'components/UserBadge/UserName';

import { CodeHighlight } from 'ui/CodeHighlight/CodeHighlight';
import { IconButton } from 'ui/Button/IconButton';
import { Loading } from 'ui/Loading/Loading';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';

import './DataTableViewQueryExamples.scss';

interface IProps {
    tableId: number;
}

export const DataTableViewQueryExamples: React.FunctionComponent<IProps> = ({
    tableId,
}) => {
    const dispatch: Dispatch = useDispatch();

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

    const loadQueryExecution = React.useCallback((queryExecutionId) => {
        dispatch(
            queryExecutionsActions.fetchQueryExecutionIfNeeded(queryExecutionId)
        );
    }, []);

    const { loading: loadingInitial } = useLoader({
        item: queryExampleIds,
        itemLoader: () =>
            dispatch(dataSourcesActions.fetchQueryExampleIdsIfNeeded(tableId)),
    });

    React.useEffect(() => {
        for (const queryId of queryExamplesIdsToLoad) {
            loadQueryExecution(queryId);
        }
    }, [queryExampleIds]);

    const openDisplayModal = (queryId) => {
        navigateWithinEnv(`/query_execution/${queryId}/`, {
            isModal: true,
        });
    };

    const getExampleDOM = () => {
        if (loadingInitial) {
            return <Loading />;
        }

        return queryExamples.map((query) => {
            const language =
                queryEngineById[query.engine_id]?.language || 'presto';
            const formattedQuery = format(query.query, language, {
                case: 'upper',
            });
            return (
                <div className="DataTableViewQueryExamples-item" key={query.id}>
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
        });
    };

    return (
        <div className="DataTableViewQueryExamples">
            {getExampleDOM()}
            <div className="center-align">
                {hasMore && (
                    <AsyncButton
                        onClick={loadMoreQueryExampleIds}
                        title="Show More"
                    />
                )}
            </div>
        </div>
    );
};
