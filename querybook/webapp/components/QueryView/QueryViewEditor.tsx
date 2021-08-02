import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { queryStatusToStatusIcon } from 'const/queryStatus';

import { navigateWithinEnv } from 'lib/utils/query-string';

import * as dataSourcesActions from 'redux/dataSources/action';
import * as adhocQueryActions from 'redux/adhocQuery/action';
import { IQueryExecution } from 'redux/queryExecutions/types';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';
import { Title } from 'ui/Title/Title';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { Button } from 'ui/Button/Button';
import { useDataFetch } from 'hooks/useDataFetch';
import { Tag } from 'ui/Tag/Tag';
import { BoundQueryEditor } from 'components/QueryEditor/BoundQueryEditor';
import * as queryExecutionActions from 'redux/queryExecutions/action';
import { myUserInfoSelector } from 'redux/user/selector';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { QueryViewEditorShareButton } from './QueryViewEditorShareButton';

export const QueryViewEditor: React.FunctionComponent<{
    queryExecution: IQueryExecution;
}> = ({ queryExecution }) => {
    const queryEngineById = useSelector(queryEngineByIdEnvSelector);
    const queryEngine = queryEngineById[queryExecution.engine_id];

    const userInfo = useSelector(myUserInfoSelector);
    const environment = useSelector(currentEnvironmentSelector);
    const showAccessControls =
        queryExecution.uid === userInfo.id && !environment.shareable;

    const dispatch = useDispatch();
    const { data: cellInfo } = useDataFetch<{
        doc_id: number;
        cell_id: number;
        cell_title?: string;
    }>({
        url: `/query_execution/${queryExecution.id}/datadoc_cell_info/`,
    });

    const goToDataDoc = React.useCallback(() => {
        if (cellInfo != null) {
            const { doc_id: docId, cell_id: cellId } = cellInfo;
            navigateWithinEnv(
                `/datadoc/${docId}/?cellId=${cellId}&executionId=${queryExecution.id}`
            );
        }
    }, [queryExecution, cellInfo]);

    const exportToAdhocQuery = React.useCallback(() => {
        dispatch(
            adhocQueryActions.receiveAdhocQuery(
                {
                    query: queryExecution.query,
                    executionId: queryExecution.id,
                    engineId: queryExecution.engine_id,
                },
                environment.id
            )
        );
        navigateWithinEnv('/adhoc/');
    }, [queryExecution, environment.id]);

    React.useEffect(() => {
        dispatch(
            dataSourcesActions.fetchFunctionDocumentationIfNeeded(
                queryEngineById[queryExecution.engine_id].language
            )
        );
        if (showAccessControls) {
            dispatch(
                queryExecutionActions.fetchQueryExecutionAccessRequests(
                    queryExecution.id
                )
            );
            dispatch(
                queryExecutionActions.fetchQueryExecutionViewers(
                    queryExecution.id
                )
            );
        }
    }, [queryEngineById, queryExecution]);

    const editorDOM = (
        <div className="editor">
            <BoundQueryEditor
                value={queryExecution.query}
                lineWrapping={true}
                readOnly={true}
                height={'fixed'}
                engine={queryEngine}
                allowFullScreen
            />
        </div>
    );

    const dataCellTitle = cellInfo?.cell_title;
    const queryExecutionTitleDOM = queryExecution ? (
        <div className="flex-row">
            <Title size={5}>
                <StatusIcon
                    status={queryStatusToStatusIcon[queryExecution.status]}
                />
                Execution {queryExecution.id}
                <span className="mh4">
                    {dataCellTitle ? `(${dataCellTitle})` : ''}
                </span>
            </Title>
            <Tag>{queryEngineById[queryExecution.engine_id].name}</Tag>
        </div>
    ) : null;

    const goToDataDocButton =
        cellInfo != null ? (
            <Button onClick={goToDataDoc} title="Go To DataDoc" />
        ) : null;

    const shareExecutionButton = showAccessControls ? (
        <QueryViewEditorShareButton queryExecution={queryExecution} />
    ) : null;

    const editorSectionHeader = (
        <div className="editor-section-header horizontal-space-between">
            <div>{queryExecutionTitleDOM}</div>

            <div className="horizontal-space-between">
                {shareExecutionButton}
                <Button onClick={exportToAdhocQuery} title="Edit" />
                {goToDataDocButton}
            </div>
        </div>
    );

    const editorSectionDOM = (
        <div className="editor-section">
            {editorSectionHeader}
            {editorDOM}
        </div>
    );

    return editorSectionDOM;
};
