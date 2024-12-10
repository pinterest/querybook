import { bind } from 'lodash-decorators';

import { IDataColumn } from 'const/metastore';
import { ICodeAnalysis, IPosition, TableToken } from 'lib/sql-helper/sql-lexer';
import {
    getLanguageSetting,
    ILanguageSetting,
} from 'lib/sql-helper/sql-setting';
import { reduxStore } from 'redux/store';
import { SearchTableResource } from 'resource/search';

interface ILineAnalysis {
    statementNum: number;
    context: string;
    reference: TableToken[];
    alias: Record<string, TableToken>;
}

function findLast(arr: Array<[number, any]>, num: number) {
    let index = 0;
    // while index is not the last index
    while (arr.length > index + 1) {
        if (arr[index + 1][0] <= num) {
            index++;
        } else {
            break;
        }
    }
    return arr[index];
}

export class SqlParser {
    private _codeAnalysis?: ICodeAnalysis;
    private metastoreId?: number;
    private language: string;
    private languageSetting: ILanguageSetting;
    private keywords?: string[];

    public constructor(language: string, metastoreId: number = null) {
        this.metastoreId = metastoreId;

        this._codeAnalysis = null;

        this.language = language;
        this.languageSetting = getLanguageSetting(this.language);
    }

    public get codeAnalysis() {
        return this._codeAnalysis;
    }

    @bind
    public set codeAnalysis(newCodeAnalysis: ICodeAnalysis) {
        this._codeAnalysis = newCodeAnalysis;
    }

    /**
     * Get the context at the given position, it could be 'table', 'column' or 'none'
     * @param pos position of the cursor or mouse pointer
     * @returns string: 'table', 'column' or 'none'
     */
    public getContextAtPos(pos: IPosition): string {
        if (!this.codeAnalysis?.editorLines) {
            return 'none';
        }
        const editorLines = this.codeAnalysis.editorLines;
        const line = editorLines[pos.line];
        if (!line) {
            return 'none';
        }

        return findLast(line.contexts, pos.ch)[1];
    }

    /**
     * Get the table at the given position
     * @param pos position of the cursor or mouse pointer
     * @returns TableToken if the cursor is on a table, otherwise null
     */
    public getTableAtPos(pos: IPosition): TableToken | null {
        const { line, ch } = pos;
        if (this.codeAnalysis) {
            const tableReferences: TableToken[] = [].concat.apply(
                [],
                Object.values(this.codeAnalysis.lineage.references)
            );

            return tableReferences.find((tableInfo) => {
                if (tableInfo.line !== line) {
                    return false;
                }
                const isSchemaExplicit =
                    tableInfo.end - tableInfo.start > tableInfo.name.length;
                const tablePos = {
                    from:
                        tableInfo.start +
                        (isSchemaExplicit ? tableInfo.schema.length : 0),
                    to: tableInfo.end,
                };

                return tablePos.from <= ch && tablePos.to >= ch;
            });
        }

        return null;
    }

    /**
     * Get the column at the given position
     * @param pos position of the cursor or mouse pointer
     * @param text the token text before or at the cursor
     * @returns IDataColumn if the cursor is on a column, otherwise null
     */
    public getColumnAtPos(pos: IPosition, text: string): IDataColumn | null {
        const columns = this.getColumnMatches(pos, text, true);
        if (columns.length === 1) {
            return columns[0];
        }
        return null;
    }

    /**
     * Get the distinct column values if the cursor is on a column
     * @param cursor position of the cursor or mouse pointer
     * @param text the token text before or at the cursor
     * @returns Array of column values if the cursor is on a column, otherwise empty array
     */
    public getColumnValues(
        cursor: IPosition,
        text: string
    ): Array<number | string> {
        const columns = this.getColumnMatches(cursor, text, true);

        if (columns.length !== 1) return [];

        const colStats = columns[0].stats ?? [];
        // find the stat with key="distinct_values"
        const distinctValuesStat = colStats.find(
            (stat) => stat.key === 'distinct_values'
        );
        if (distinctValuesStat?.value instanceof Array) {
            return distinctValuesStat?.value;
        }

        return [];
    }

    /**
     * Get the columns match for the current cursor position and given text
     *
     * @param cursor cursor position
     * @param text token text before or at the cursor
     * @param exactMatch whether to do exact match or prefix match
     */
    public getColumnMatches(
        cursor: IPosition,
        text: string,
        exactMatch: boolean = false
    ): IDataColumn[] {
        const lineAnalysis: ILineAnalysis = this.getLineAnalysis(cursor);

        const tokenText = text.toLowerCase();

        if (tokenText.includes('.')) {
            const tableNames: Array<Partial<TableToken>> = [];
            const context = tokenText.split('.');
            // for the case of schema.table.column
            if (context.length === 3) {
                tableNames.push({
                    schema: context[0],
                    name: context[1],
                });
            } else if (context.length === 2 && lineAnalysis.reference) {
                const name = context[0];
                if (name in lineAnalysis.alias) {
                    const table = lineAnalysis.alias[name];
                    tableNames.push(table);
                } else {
                    for (const table of lineAnalysis.reference) {
                        if (table.name === name) {
                            tableNames.push(table);
                        }
                    }
                }
            }

            const columnName = context[context.length - 1].toLowerCase();
            return this.getColumnsFromPrefix(
                columnName,
                tableNames,
                exactMatch
            );
        } else {
            return this.getColumnsFromPrefix(
                tokenText,
                lineAnalysis.reference,
                exactMatch
            );
        }
    }

    public getKeyWordMatches(searchStr: string) {
        const keywordList = this.getKeywords();

        if (!searchStr || searchStr.length < 2 || searchStr.includes('.')) {
            // we don't autosuggest keywords unless it is at least 2 characters long
            // if autocomplete type is schema, then keyword is not provided
            return [];
        }

        const result = [];
        for (const word of keywordList) {
            if (this.prefixMatch(searchStr, word)) {
                result.push(word.toUpperCase());
            }
        }

        // If user already has typed the full keyword, dont show the hint
        if (
            result.length === 1 &&
            searchStr.toUpperCase() === result[0].toUpperCase()
        ) {
            return [];
        }

        return result;
    }

    /**
     * Get the table names that match the given prefix
     * @param prefix prefix to match
     * @returns Array of table names that match the prefix
     */
    public async getTableNameMatches(prefix: string): Promise<string[]> {
        const metastoreId = this.metastoreId;
        if (metastoreId == null) {
            return [];
        }

        const { data: tableNames } = await SearchTableResource.suggest(
            metastoreId,
            prefix
        );

        // Filter out table names that are not in the format of schema.table
        return tableNames.filter((tableName) => {
            const schemaTableNames = tableName.split('.');
            return schemaTableNames.length === 2;
        });
    }

    private getLineAnalysis(cursor: IPosition): ILineAnalysis {
        const lineAnalysis: ILineAnalysis = {
            context: 'none',
            alias: {},
            reference: [],
            statementNum: 0,
        };
        if (this.codeAnalysis && this.codeAnalysis.editorLines) {
            const editorLines = this.codeAnalysis.editorLines;
            const line = editorLines[cursor.line];
            if (line != null) {
                lineAnalysis.statementNum = findLast(
                    line.statements,
                    cursor.ch
                )[1];
                lineAnalysis.context = findLast(line.contexts, cursor.ch)[1];
                lineAnalysis.reference =
                    this.codeAnalysis.lineage.references[
                        lineAnalysis.statementNum
                    ];
                lineAnalysis.alias =
                    this.codeAnalysis.lineage.aliases[
                        lineAnalysis.statementNum
                    ];
            }
        }

        return lineAnalysis;
    }

    private getKeywords() {
        if (!this.keywords) {
            this.keywords = [...this.languageSetting.keywords];
        }
        return this.keywords;
    }

    private prefixMatch(prefix: string, word: string) {
        const len = prefix.length;
        return word.substring(0, len).toUpperCase() === prefix.toUpperCase();
    }

    private getColumnsFromPrefix(
        prefix: string,
        tableNames: Array<Partial<TableToken>>,
        exactMatch: boolean = false
    ) {
        const { dataSources } = reduxStore.getState();

        const dataTables = tableNames
            .map((table) => `${table.schema}.${table.name}`)
            .filter(
                (tableName) =>
                    tableName in
                    (dataSources.dataTableNameToId[this.metastoreId] || {})
            )
            .map(
                (tableName) =>
                    dataSources.dataTableNameToId[this.metastoreId][tableName]
            )
            .map((tableId) => dataSources.dataTablesById[tableId]);
        const columnIds = [].concat(...dataTables.map((table) => table.column));
        const columns = columnIds.map((id) => dataSources.dataColumnsById[id]);
        const filteredColumns = columns.filter((column) =>
            exactMatch
                ? column.name.toLowerCase() === prefix
                : column.name.toLowerCase().startsWith(prefix)
        );

        return filteredColumns;
    }
}
