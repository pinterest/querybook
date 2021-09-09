import type { IAccessRequest } from 'const/accessRequest';
import type {
    IQueryError,
    IQueryExecution,
    IQueryExecutionNotification,
    IQueryExecutionViewer,
    IQueryResultExporter,
    IRawQueryExecution,
} from 'const/queryExecution';
import ds from 'lib/datasource';
import dataDocSocket from 'lib/data-doc/datadoc-socketio';

export const QueryExecutionAccessRequestResource = {
    get: (executionId: number) =>
        ds.fetch<IAccessRequest[]>(
            `/query_execution/${executionId}/access_request/`
        ),
    create: (executionId: number) =>
        ds.save<IAccessRequest>(
            `/query_execution/${executionId}/access_request/`
        ),

    delete: (executionId: number, forUid: number) =>
        ds.delete(`/query_execution/${executionId}/access_request/`, {
            uid: forUid,
        }),
};

export const QueryExecutionViewerResource = {
    get: (executionId: number) =>
        ds.fetch<IQueryExecutionViewer[]>(
            `/query_execution/${executionId}/viewer/`
        ),
    create: (executionId: number, uid: number) =>
        ds.save<IQueryExecutionViewer>(
            `/query_execution/${executionId}/viewer/`,
            {
                uid,
            }
        ),
    delete: (viewerId: number) =>
        ds.delete(`/query_execution_viewer/${viewerId}/`),
};

export const QueryExecutionResource = {
    getDataDoc: (executionId: number) =>
        ds.fetch<{
            doc_id: number;
            cell_id: number;
            cell_title: string;
        } | null>(`/query_execution/${executionId}/datadoc_cell_info/`),

    get: (id: number) =>
        ds.fetch<IRawQueryExecution>(`/query_execution/${id}/`),

    search: (uid: number, environmentId: number) =>
        ds.fetch<IQueryExecution[]>('/query_execution/search/', {
            filters: {
                user: uid,
                running: true,
            },
            environment_id: environmentId,
        }),

    create: (query: string, engineId: number, cellId?: number) => {
        const params = {
            query,
            engine_id: engineId,
        };

        if (cellId != null) {
            params['data_cell_id'] = cellId;
            params['originator'] = dataDocSocket.socketId;
        }

        return ds.save<IRawQueryExecution>('/query_execution/', params);
    },

    cancel: (id: number) => ds.delete(`/query_execution/${id}/`),

    getError: (executionId: number) =>
        ds.fetch<IQueryError>(`/query_execution/${executionId}/error/`),
};

export const StatementResource = {
    getResult: (id: number) =>
        ds.fetch<string[][]>({
            url: `/statement_execution/${id}/result/`,
        }),
    getLogs: (id: number) =>
        ds.fetch<string[]>(`/statement_execution/${id}/log/`),

    getExporters: () =>
        ds.fetch<IQueryResultExporter[]>('/query_execution_exporter/'),

    export: (
        statementId: number,
        exporterName: string,
        exporterParams?: Record<any, any>
    ) => {
        const params = { exporter_name: exporterName };
        if (exporterParams) {
            params['exporter_params'] = exporterParams;
        }

        return ds.fetch<string>(
            `/query_execution_exporter/statement_execution/${statementId}/`,
            params
        );
    },

    /**
     * Get the Authorization url for the exporter
     *
     * @param exporterName
     */
    getExporterAuth: (exporterName: string) =>
        ds.fetch<string>('/query_execution_exporter/auth/', {
            exporter_name: exporterName,
        }),
};

export const QueryExecutionNotificationResource = {
    get: (executionId: number) =>
        ds.fetch<IQueryExecutionNotification | null>(
            `/query_execution_notification/${executionId}/`
        ),
    create: (executionId: number) =>
        ds.save<IQueryExecutionNotification>(
            `/query_execution_notification/${executionId}/`
        ),

    delete: (executionId: number) =>
        ds.delete(`/query_execution_notification/${executionId}/`),
};

export const TemplatedQueryResource = {
    getVariables: (query: string) =>
        ds.fetch<string[]>('/query_execution/templated_query_params/', {
            query,
        }),
    renderTemplatedQuery: (
        query: string,
        variables: Record<string, string>,
        engineId: number
    ) =>
        ds.fetch<string>(
            '/query_execution/templated_query/',
            {
                query,
                variables,
                engine_id: engineId,
            },
            false
        ),
};
