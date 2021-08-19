import { IAccessRequest } from 'const/accessRequest';
import {
    IQueryError,
    IQueryExecution,
    IQueryExecutionNotification,
    IQueryExecutionViewer,
    IQueryResultExporter,
} from 'const/queryExecution';
import ds from 'lib/datasource';
import dataDocSocket from 'lib/data-doc/datadoc-socketio';

export function getDataDocFromExecution(executionId: number) {
    return ds.fetch<{
        doc_id: number;
        cell_id: number;
        cell_title: string;
    } | null>(`/query_execution/${executionId}/datadoc_cell_info/`);
}

export function getQueryExecutionAccessRequests(executionId: number) {
    return ds.fetch<IAccessRequest[]>(
        `/query_execution/${executionId}/access_request/`
    );
}

export function createQueryExecutionAccessRequest(executionId: number) {
    return ds.save<IAccessRequest>(
        `/query_execution/${executionId}/access_request/`
    );
}

export function deleteQueryExecutionAccessRequest(
    executionId: number,
    forUid: number
) {
    return ds.delete(`/query_execution/${executionId}/access_request/`, {
        uid: forUid,
    });
}

export function getQueryExecutionViewers(executionId: number) {
    return ds.fetch<IQueryExecutionViewer[]>(
        `/query_execution/${executionId}/viewer/`
    );
}

export function createQueryExecutionViewer(executionId: number, uid: number) {
    return ds.save<IQueryExecutionViewer>(
        `/query_execution/${executionId}/viewer/`,
        {
            uid,
        }
    );
}

export function deleteQueryExecutionViewer(viewerId: number) {
    return ds.delete(`/query_execution_viewer/${viewerId}/`);
}

export function getQueryExecution(id: number) {
    return ds.fetch<IQueryExecution>(`/query_execution/${id}/`);
}

export function searchUserQueryExecutions(uid: number, environmentId: number) {
    return ds.fetch<IQueryExecution[]>('/query_execution/search/', {
        filters: {
            user: uid,
            running: true,
        },
        environment_id: environmentId,
    });
}

export function createQueryExecution(
    query: string,
    engineId: number,
    cellId?: number
) {
    const params = {
        query,
        engine_id: engineId,
    };

    if (cellId != null) {
        params['data_cell_id'] = cellId;
        params['originator'] = dataDocSocket.socketId;
    }

    return ds.save<IQueryExecution>('/query_execution/', params);
}

export function cancelQueryExecution(id: number) {
    return ds.delete(`/query_execution/${id}/`);
}

export function getQueryExecutionError(executionId: number) {
    return ds.fetch<IQueryError>(`/query_execution/${executionId}/error/`);
}

export function getStatementResult(id: number) {
    return ds.fetch<string[][]>({
        url: `/statement_execution/${id}/result/`,
    });
}

export function getStatementLogs(id: number) {
    return ds.fetch<string[]>(`/statement_execution/${id}/log/`);
}

export function getQueryExecutionExporters() {
    return ds.fetch<IQueryResultExporter[]>('/query_execution_exporter/');
}

export function exportStatementExecution(
    statementId: number,
    exporterName: string,
    exporterParams?: Record<any, any>
) {
    const params = { exporter_name: exporterName };
    if (exporterParams) {
        params['exporter_params'] = exporterParams;
    }

    return ds.fetch<string>(
        `/query_execution_exporter/statement_execution/${statementId}/`,
        params
    );
}

export function acquireExporterAuth(exporterName: string) {
    return ds.fetch<string>('/query_execution_exporter/auth/', {
        export_name: exporterName,
    });
}

export function getQueryExecutionNotification(executionId: number) {
    return ds.fetch<IQueryExecutionNotification | null>(
        `/query_execution_notification/${executionId}/`
    );
}

export function createQueryExecutionNotification(executionId: number) {
    return ds.save<IQueryExecutionNotification>(
        `/query_execution_notification/${executionId}/`
    );
}

export function deleteQueryExecutionNotification(executionId: number) {
    return ds.delete(`/query_execution_notification/${executionId}/`);
}
