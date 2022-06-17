import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { BoundQueryEditor } from 'components/QueryEditor/BoundQueryEditor';
import { IQueryExecution } from 'const/queryExecution';
import { queryStatusToStatusIcon } from 'const/queryStatus';
import { useResource } from 'hooks/useResource';
import { navigateWithinEnv } from 'lib/utils/query-string';
import * as adhocQueryActions from 'redux/adhocQuery/action';
import * as dataSourcesActions from 'redux/dataSources/action';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';
import * as queryExecutionActions from 'redux/queryExecutions/action';
import { myUserInfoSelector } from 'redux/user/selector';
import { QueryExecutionResource } from 'resource/queryExecution';
import { Button } from 'ui/Button/Button';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { Tag } from 'ui/Tag/Tag';
import { Title } from 'ui/Title/Title';

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
    const { data: cellInfo } = useResource(
        React.useCallback(
            () => QueryExecutionResource.getDataDoc(queryExecution.id),
            [queryExecution.id]
        )
    );

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
            <Title size="med" className="mr16">
                <StatusIcon
                    status={queryStatusToStatusIcon[queryExecution.status]}
                />
                <span className="ml8">Execution {queryExecution.id}</span>
                {dataCellTitle ? (
                    <span className="ml8">{dataCellTitle}</span>
                ) : null}
            </Title>
            <Tag>{queryEngineById[queryExecution.engine_id].name}</Tag>
        </div>
    ) : null;

    const goToDataDocButton =
        cellInfo != null ? (
            <Button
                onClick={goToDataDoc}
                title="Go To DataDoc"
                icon="ArrowRight"
                theme="text"
            />
        ) : null;

    const shareExecutionButton = showAccessControls ? (
        <QueryViewEditorShareButton queryExecution={queryExecution} />
    ) : null;

    const editorSectionHeader = (
        <div className="editor-section-header horizontal-space-between">
            <div>{queryExecutionTitleDOM}</div>
            <div className="horizontal-space-between">
                {shareExecutionButton}
                <Button
                    onClick={exportToAdhocQuery}
                    title="Edit"
                    icon="Edit"
                    theme="text"
                />
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
