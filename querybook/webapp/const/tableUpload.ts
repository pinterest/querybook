export type UploadSourceType = 'file' | 'query_execution';

export const UploadedTableColumnTypes = [
    'float',
    'integer',
    'string',
    'datetime',
    'boolean',
] as const;
export type TUploadedTableColumnTypes = typeof UploadedTableColumnTypes[number];

export const UploadedTableIfExistOptions = [
    'fail',
    'replace',
    'append',
] as const;
export type TUploadedTableIfExist = typeof UploadedTableIfExistOptions[number];

export interface ICSVParseConfig {
    // fields related to parsing
    delimiter: string;
    first_row_column: boolean;

    // fields related to row processing
    skip_rows?: number;
    max_rows?: number;
    skip_initial_space?: boolean;
    skip_blank_lines?: boolean;
}

export interface ITableExporterConfig {
    table_name: string;
    schema_name: string;
    if_exists: TUploadedTableIfExist;

    column_name_types: Array<
        [columnName: string, type: TUploadedTableColumnTypes]
    >;
}

export interface IFileImporterConfig {
    source_type: 'file';
    parse_config: ICSVParseConfig;
}

export interface IQueryExecutionImporterConfig {
    source_type: 'query_execution';
    query_execution_id: number;
}

export interface ITableUploadConfigForm {
    table_config: ITableExporterConfig;

    import_config: IFileImporterConfig | IQueryExecutionImporterConfig;
    file?: File; // Part  of import_config as well

    engine_id: number;
}

export interface ITableUploadPreviewForm {
    import_config: IFileImporterConfig | IQueryExecutionImporterConfig;
    file?: File; // Part  of import_config as well
}
