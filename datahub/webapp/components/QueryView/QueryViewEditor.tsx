import React, { useMemo, useState, useRef } from 'react';
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
import { Popover } from 'ui/Popover/Popover';
import { QueryExecutionAccessList } from 'components/QueryExecutionAccessList/QueryExecutionAccessList';
import { IStoreState } from 'redux/store/types';
import * as queryExecutionSelectors from 'redux/queryExecutions/selector';
import * as queryExecutionActions from 'redux/queryExecutions/action';
import { myUserInfoSelector } from 'redux/user/selector';
import { currentEnvironmentSelector } from 'redux/environment/selector';

export const QueryViewEditor: React.FunctionComponent<{
    queryExecution: IQueryExecution;
}> = ({ queryExecution }) => {
    const queryEngineById = useSelector(queryEngineByIdEnvSelector);
    const queryEngine = queryEngineById[queryExecution.engine_id];
    const accessRequestsByUid = useSelector((state: IStoreState) =>
        queryExecutionSelectors.queryExecutionAccessRequestsByUidSelector(
            state,
            queryExecution.id
        )
    );
    const executionViewersByUid = useSelector((state: IStoreState) =>
        queryExecutionSelectors.queryExecutionViewersByUidSelector(
            state,
            queryExecution.id
        )
    );
    const userInfo = useSelector(myUserInfoSelector);
    const environment = useSelector(currentEnvironmentSelector);
    const showAccessControls =
        queryExecution.uid == userInfo.id && !environment.shareable;
    const [showAccessList, setShowAccessList] = useState(false);

    const dispatch = useDispatch();
    const { data: cellInfo } = useDataFetch<{
        doc_id: number;
        cell_id: number;
        cell_title?: string;
    }>({
        url: `/query_execution/${queryExecution.id}/datadoc_cell_info/`,
    });

    const buttonRef = useRef<HTMLAnchorElement>(null);

    const goToDataDoc = React.useCallback(() => {
        if (cellInfo != null) {
            const { doc_id: docId, cell_id: cellId } = cellInfo;
            navigateWithinEnv(
                `/datadoc/${docId}/?cellId=${cellId}&executionId=${queryExecution.id}`
            );
        }
    }, [queryExecution, cellInfo]);

    const exportToAdhocQuery = React.useCallback(() => {
        dispatch(adhocQueryActions.receiveAdhocQuery(queryExecution.query));
        dispatch(
            adhocQueryActions.receiveAdhocEngineId(queryExecution.engine_id)
        );
        dispatch(adhocQueryActions.receiveAdhocExecutionId(queryExecution.id));
        navigateWithinEnv('/adhoc/');
    }, [queryExecution]);

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

    const addQueryExecutionViewer = React.useCallback(
        (uid) => {
            dispatch(
                queryExecutionActions.addQueryExecutionViewer(
                    queryExecution.id,
                    uid
                )
            );
        },
        [queryExecution]
    );

    const deleteQueryExecutionViewer = React.useCallback(
        (uid) => {
            dispatch(
                queryExecutionActions.deleteQueryExecutionViewer(
                    queryExecution.id,
                    uid
                )
            );
        },
        [queryExecution]
    );

    const rejectQueryExecutionAccessRequest = React.useCallback(
        (uid) => {
            dispatch(
                queryExecutionActions.rejectQueryExecutionAccessRequest(
                    queryExecution.id,
                    uid
                )
            );
        },
        [queryExecution]
    );

    const editorDOM = (
        <div className="editor">
            <BoundQueryEditor
                value={queryExecution.query}
                lineWrapping={true}
                readOnly={true}
                height={'fixed'}
                engine={queryEngine}
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

    const accessRequestsByUidLength = Object.values(accessRequestsByUid).length;
    const shareButton = showAccessControls && (
        <Button
            className="share-button"
            title="Share"
            ping={
                accessRequestsByUidLength > 0
                    ? accessRequestsByUidLength.toString()
                    : null
            }
            ref={buttonRef}
            onClick={() => setShowAccessList(!showAccessList)}
        />
    );

    const viewersListDOM = showAccessControls && showAccessList && (
        <Popover
            anchor={buttonRef.current}
            onHide={() => setShowAccessList(false)}
            layout={['bottom', 'right']}
            resizeOnChange
        >
            <QueryExecutionAccessList
                accessRequestsByUid={accessRequestsByUid}
                executionViewersByUid={executionViewersByUid}
                queryExecution={queryExecution}
                addQueryExecutionViewer={addQueryExecutionViewer}
                deleteQueryExecutionViewer={deleteQueryExecutionViewer}
                rejectQueryExecutionAccessRequest={
                    rejectQueryExecutionAccessRequest
                }
            />
        </Popover>
    );

    const editorSectionHeader = (
        <div className="editor-section-header horizontal-space-between">
            <div>{queryExecutionTitleDOM}</div>

            <div>
                {shareButton}
                {viewersListDOM}
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
