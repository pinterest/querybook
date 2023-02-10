import { ILinterWarning, TableToken } from './sql-lexer';

import { DataTableWarningSeverity } from 'const/metastore';
import { reduxStore } from 'redux/store';

export function getContextSensitiveWarnings(
    metastoreId: number,
    tableReferences: TableToken[],
    ignoreTableNotExistWarnings: boolean
) {
    const contextSensitiveWarnings: ILinterWarning[] = [];

    const { dataTableNameToId, dataTablesById, dataTableWarningById } =
        reduxStore.getState().dataSources;
    for (const table of tableReferences) {
        const implicitSchema = table.end - table.start === table.name.length;
        const fullName = `${table.schema}.${table.name}`;
        const tableExists = fullName in (dataTableNameToId[metastoreId] || {});

        if (!tableExists) {
            if (!ignoreTableNotExistWarnings) {
                contextSensitiveWarnings.push({
                    message: `Table ${table.name} is newly created or does not exist`,
                    severity: 'warning',
                    type: 'lint',
                    from: {
                        line: table.line,
                        ch: implicitSchema
                            ? table.start
                            : table.start + table.schema.length + 1,
                    },
                    to: {
                        line: table.line,
                        ch: table.end,
                    },
                });
            }
        } else {
            const tableId = dataTableNameToId[metastoreId][fullName];
            const dataTable = dataTablesById[tableId];
            if (dataTable.warnings?.length) {
                const tableWarnings = dataTable.warnings.map(
                    (id) => dataTableWarningById[id]
                );
                const warningMessage = tableWarnings
                    .map(
                        (warning) =>
                            (warning.severity === DataTableWarningSeverity.ERROR
                                ? 'ERROR:'
                                : 'WARN:') + warning.message
                    )
                    .join('\n');
                const maxSeverity: DataTableWarningSeverity = Math.max(
                    ...tableWarnings.map((warning) => warning.severity)
                );

                contextSensitiveWarnings.push({
                    message: warningMessage,
                    type: 'lint',
                    severity:
                        maxSeverity === DataTableWarningSeverity.ERROR
                            ? 'error'
                            : 'warning',
                    from: {
                        line: table.line,
                        ch: implicitSchema
                            ? table.start
                            : table.start + table.schema.length + 1,
                    },
                    to: {
                        line: table.line,
                        ch: table.end,
                    },
                });
            }
        }
    }

    return contextSensitiveWarnings;
}
