export function tableToTSV(table: any[][]) {
    return table
        .map((row) =>
            row.map((cell) => String(cell).replace(/\s/g, ' ')).join('\t')
        )
        .join('\n');
}

export function tableToCSV(table: any[][]) {
    return table
        .map((row) =>
            row
                .map(
                    (cell) =>
                        `"${String(cell)
                            .replace('"', '""')
                            .replace('\n', ' ')}"`
                )
                .join(',')
        )
        .join('\n');
}
