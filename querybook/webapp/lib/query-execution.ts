export function getStatementExecutionResultDownloadUrl(id: number) {
    return `${location.protocol}//${location.hostname}/ds/statement_execution/${id}/result/download/`;
}
