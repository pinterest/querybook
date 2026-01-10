export function getStatementExecutionResultDownloadUrl(id: number, type: "csv" | "xlsx" = "csv"): string {
    return `${location.protocol}//${location.host}/ds/statement_execution/${id}/result/download/?type=${type}`;
}
