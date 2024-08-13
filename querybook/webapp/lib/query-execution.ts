export function getStatementExecutionResultDownloadUrl(id: number) {
    return `${location.protocol}//${location.host}/ds/statement_execution/${id}/result/download/`;
}
export function getStatementExecutionResultDownloadUrlXlsx(id: number) {
    return `${location.protocol}//${location.host}/ds/statement_execution/${id}/result/download_xlsx/`;
}
