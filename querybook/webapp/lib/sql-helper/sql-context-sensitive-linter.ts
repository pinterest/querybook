import { reduxStore } from 'redux/store';
import { fetchDataTableByNameIfNeeded } from 'redux/dataSources/action';

import { ILinterWarning, ILineage, TableToken } from './sql-lexer';
import { DataTableWarningSeverity } from 'const/metastore';

const tableDoesNotExistCache = new Set();

export async function getContextSensitiveWarnings(
    metastoreId: number,
    lineage: ILineage
) {
    const contextSensitiveWarnings: ILinterWarning[] = [];
    const statements = Object.values(lineage.references || {});

    let allTables: TableToken[] = [];
    for (const statement of statements) {
        allTables = allTables.concat(statement);
    }

    const tablesGettingLoaded = new Set();
    const tableLoadPromises: Array<Promise<any>> = [];
    for (const table of allTables) {
        const fullName = `${table.schema}.${table.name}`;
        if (
            !(
                tablesGettingLoaded.has(fullName) ||
                tableDoesNotExistCache.has(fullName)
            )
        ) {
            tableLoadPromises.push(
                reduxStore.dispatch(
                    fetchDataTableByNameIfNeeded(
                        table.schema,
                        table.name,
                        metastoreId
                    ) as any
                )
            );
            tablesGettingLoaded.add(fullName);
        }
    }
    await Promise.all(tableLoadPromises);

    const {
        dataTableNameToId,
        dataTablesById,
        dataTableWarningById,
    } = reduxStore.getState().dataSources;
    for (const table of allTables) {
        const implicitSchema = table.end - table.start === table.name.length;
        const fullName = `${table.schema}.${table.name}`;
        const tableExists = fullName in (dataTableNameToId[metastoreId] || {});

        if (!tableExists) {
            contextSensitiveWarnings.push({
                message: `Table ${table.name} is newly created or does not exist`,
                severity: 'warning',
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
            tableDoesNotExistCache.add(fullName);
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
