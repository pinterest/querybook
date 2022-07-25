import {
    findTableReferenceAndAlias,
    getStatementType,
    simpleParse,
    tokenize,
} from './sql-lexer';
import { isEmpty } from 'lodash';

/**
 * Check if a query will drop any tables, e.g. containing any `DROP TABLE <table_name>;` statements.
 * Will also check if the same table gets recreated in the query. If so, it will not be counted.
 *
 * @param {string} query - Query to be executed.
 * @return {string[]} - A list of table names to be dropped.
 */
export const getDroppedTables = (query: string): string[] => {
    const tokens = tokenize(query);
    const statements = simpleParse(tokens);
    const { references: tablesByStatement } =
        findTableReferenceAndAlias(statements);

    const tablesToBeDropped = new Set<string>();

    statements.forEach((statement, statementNum) => {
        const statementType = getStatementType(statement);
        const tables = tablesByStatement[statementNum];
        if (isEmpty(tables)) {
            return;
        }
        const tableName = `${tables[0].schema}.${tables[0].name}`;
        if (statementType === 'drop') {
            tablesToBeDropped.add(tableName);
        } else if (statementType === 'create') {
            tablesToBeDropped.delete(tableName);
        }
    });

    return Array.from(tablesToBeDropped);
};
