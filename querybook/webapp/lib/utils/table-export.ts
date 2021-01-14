export function tableToTSV(table: string[][]) {
    return table
        .map((row) => row.map((cell) => cell.replace(/\s/g, ' ')).join('\t'))
        .join('\n');
}

export function tableToCSV(table: string[][]) {
    return table
        .map((row) =>
            row
                .map(
                    (cell) => `"${cell.replace('"', '""').replace('\n', ' ')}"`
                )
                .join(',')
        )
        .join('\n');
}
