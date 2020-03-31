import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { queryStatusToStatusIcon } from 'const/queryStatus';

import { getCodeEditorTheme } from 'lib/utils';
import { navigateWithinEnv } from 'lib/utils/query-string';

import * as dataSourcesActions from 'redux/dataSources/action';
import * as adhocQueryActions from 'redux/adhocQuery/action';
import { IQueryExecution } from 'redux/queryExecutions/types';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';
import { IStoreState } from 'redux/store/types';
import { QueryEditor } from 'components/QueryEditor/QueryEditor';
import { Title } from 'ui/Title/Title';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { Button } from 'ui/Button/Button';
import { useDataFetch } from 'hooks/useDataFetch';
import { Tag } from 'ui/Tag/Tag';

export const QueryViewEditor: React.FunctionComponent<{
    queryExecution: IQueryExecution;
}> = ({ queryExecution }) => {
    const queryEngineById = useSelector(queryEngineByIdEnvSelector);
    const editorLanguage = queryEngineById[queryExecution.engine_id].language;

    const {
        functionDocumentationByNameByLanguage,
        codeEditorTheme,
    } = useSelector((state: IStoreState) => ({
        functionDocumentationByNameByLanguage:
            state.dataSources.functionDocumentationByNameByLanguage,
        codeEditorTheme: getCodeEditorTheme(state.user.computedSettings.theme),
    }));

    const dispatch = useDispatch();

    const fetchDataTableByNameIfNeeded = React.useCallback(
        (schemaName, tableName) =>
            dispatch(
                dataSourcesActions.fetchDataTableByNameIfNeeded(
                    schemaName,
                    tableName,
                    queryEngineById[queryExecution.engine_id].metastore_id
                )
            ),
        [queryEngineById, queryExecution]
    );

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
    }, [queryEngineById, queryExecution]);

    const editorDOM = (
        <div className="editor">
            <QueryEditor
                value={queryExecution.query}
                lineWrapping={true}
                readOnly={true}
                height={'fixed'}
                language={editorLanguage}
                functionDocumentationByNameByLanguage={
                    functionDocumentationByNameByLanguage
                }
                theme={codeEditorTheme}
                getTableByName={fetchDataTableByNameIfNeeded}
            />
        </div>
    );

    const dataCellTitle = cellInfo?.cell_title;
    const queryExecutionTitleDOM = queryExecution ? (
        <div>
            <Title size={5}>
                <StatusIcon
                    status={queryStatusToStatusIcon[queryExecution.status]}
                />
                Execution {queryExecution.id}&nbsp;
                {dataCellTitle ? `(${dataCellTitle})` : ''} &nbsp;
                <Tag>{queryEngineById[queryExecution.engine_id].name}</Tag>
            </Title>
        </div>
    ) : null;

    const goToDataDocButton =
        cellInfo != null ? (
            <Button onClick={goToDataDoc} title="Go To DataDoc" />
        ) : null;

    const editorSectionHeader = (
        <div className="editor-section-header horizontal-space-between">
            <div>{queryExecutionTitleDOM}</div>

            <div>
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
