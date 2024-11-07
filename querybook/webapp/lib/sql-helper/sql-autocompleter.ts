import { Completion, CompletionResult } from '@codemirror/autocomplete';
import { bind } from 'lodash-decorators';

import { CodeMirrorToken } from 'lib/codemirror/utils';
import { ICodeAnalysis, TableToken } from 'lib/sql-helper/sql-lexer';
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

export type AutoCompleteType = 'none' | 'schema' | 'all';

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

export class SqlAutoCompleter {
    private codeAnalysis?: ICodeAnalysis;
    private metastoreId?: number;
    private language: string;
    private languageSetting: ILanguageSetting;
    private keywords?: string[];
    private type: AutoCompleteType;

    public constructor(
        language: string,
        metastoreId: number = null,
        type: AutoCompleteType = 'all'
    ) {
        this.metastoreId = metastoreId;
        this.type = type;

        this.codeAnalysis = null;

        this.language = language;
        this.languageSetting = getLanguageSetting(this.language);
    }

    @bind
    public updateCodeAnalysis(codeAnalysis: ICodeAnalysis) {
        this.codeAnalysis = codeAnalysis;
    }

    public getKeywords() {
        if (!this.keywords) {
            this.keywords = [...this.languageSetting.keywords];
        }
        return this.keywords;
    }

    private prefixMatch(prefix: string, word: string) {
        const len = prefix.length;
        return word.substring(0, len).toUpperCase() === prefix.toUpperCase();
    }

    private addKeyWordMatches(searchStr: string, wordList: string[]) {
        if (searchStr.length < 2 || this.type === 'schema') {
            // we don't autosuggest keywords unless it is at least 2 characters long
            // if autocomplete type is schema, then keyword is not provided
            return [];
        }

        const result = [];
        for (const word of wordList) {
            if (this.prefixMatch(searchStr, word)) {
                result.push({ label: word.toUpperCase(), detail: 'keyword' });
            }
        }

        // If user already has typed the full keyword, dont show the hint
        if (
            result.length === 1 &&
            searchStr.toUpperCase() === result[0].label.toUpperCase()
        ) {
            return [];
        }

        return result;
    }

    private async getTableNamesFromPrefix(prefix: string): Promise<string[]> {
        const metastoreId = this.metastoreId;
        if (metastoreId == null) {
            return [];
        }

        const { data: names } = await SearchTableResource.suggest(
            metastoreId,
            prefix
        );
        return names;
    }

    private getColumnsFromPrefix(
        prefix: string,
        tableNames: Array<Partial<TableToken>>
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
        const columnNames = columnIds.map(
            (id) => dataSources.dataColumnsById[id].name
        );
        const filteredColumnNames = columnNames.filter((name) =>
            name.toLowerCase().startsWith(prefix)
        );

        return filteredColumnNames;
    }

    private async addFlatContextMatches(
        searchStr: string,
        lineAnalysis: ILineAnalysis
    ): Promise<Completion[]> {
        if (lineAnalysis.context === 'table') {
            return (await this.getTableNamesFromPrefix(searchStr)).map(
                (tableName) => ({
                    label: tableName,
                    detail: 'table',
                })
            );
        } else if (
            lineAnalysis.context === 'column' &&
            lineAnalysis.reference
        ) {
            return this.getColumnsFromPrefix(
                searchStr,
                lineAnalysis.reference
            ).map((columnName) => ({
                label: columnName,
                detail: 'column',
            }));
        }

        return [];
    }

    private async addHierarchicalContextMatches(
        token: CodeMirrorToken,
        lineAnalysis: ILineAnalysis
    ): Promise<Completion[]> {
        const context = token.text.split('.');

        if (lineAnalysis.context === 'table') {
            const prefix = context.join('.');
            const tableNames = await this.getTableNamesFromPrefix(prefix);

            const results = [];
            for (const tableName of tableNames) {
                const schemaTableNames = tableName.split('.');

                if (schemaTableNames.length === 2) {
                    results.push({
                        label: tableName,
                        detail: 'table',
                    });
                }
            }
            return results;
        } else if (lineAnalysis.context === 'column') {
            const tableNames: Array<Partial<TableToken>> = [];
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

            const prefix = context[context.length - 1].toLowerCase();
            return this.getColumnsFromPrefix(prefix, tableNames).map(
                (column) => ({
                    label: column,
                    detail: 'column',
                })
            );
        }
    }

    public getCompletions(
        cursor: { line: number; ch: number },
        token: CodeMirrorToken | null,
        options: {
            passive?: boolean;
        } = {}
    ): Promise<CompletionResult | null> {
        if (this.type === 'none') {
            return Promise.resolve(null);
        }

        const passive = !!options['passive'];

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

        let result: Completion[] = [];
        const searchStr = token.text.toLowerCase();

        return new Promise(async (resolve) => {
            if (searchStr.length > 0 || !passive) {
                if (searchStr.includes('.')) {
                    const matches = await this.addHierarchicalContextMatches(
                        token,
                        lineAnalysis
                    );
                    result = matches;
                } else {
                    const flatMatches = await this.addFlatContextMatches(
                        searchStr,
                        lineAnalysis
                    );
                    const keywatchMatches = this.addKeyWordMatches(
                        searchStr,
                        this.getKeywords()
                    );

                    result = flatMatches.concat(keywatchMatches);
                }
            }

            let from = token.from;
            if (lineAnalysis.context === 'column') {
                from += token.text.lastIndexOf('.') + 1;
            }

            resolve({
                from,
                options: result ?? [],
            });
        });
    }
}
