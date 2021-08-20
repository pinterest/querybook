export function getStatementExecutionResultDownloadUrl(id: number) {
    return `${location.protocol}//${location.host}/ds/statement_execution/${id}/result/download/`;
}
