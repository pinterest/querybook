import { arrayGroupByField } from '.';

export interface IUDFRendererValues {
    functionName: string;
    udfLanguage: string;
    outputType: string;
    parameters: Array<{
        name: string;
        type: string;
    }>;
    script: string;
}

export interface IUDFEngineConfig {
    engineLanguage: string;
    supportedUDFLanguages: Array<{
        /**
         * Used as display option, if not provided, name would be used
         */
        displayName?: string;
        /**
         * Used in rendering
         */
        name: string;
        /**
         * Mode for the code editor (codemirror)
         */
        codeEditorMode: string;

        /**
         * If true, outputType is ignored in both form UI and rendering
         */
        noOutputType?: boolean;

        /**
         * If true, parameters is ignored in both form UI and rendering
         */
        noParameters?: boolean;
    }>;
    /**
     * This does not need to be comprehensive, we
     * will allow users to define new types if it
     * is recursive, like STRUCT<...>
     */
    dataTypes: string[];

    /**
     * Convert IUDFRendererValues to SQL string
     */
    renderer: (config: IUDFRendererValues) => string;

    /**
     * If provided, doc links will be shown on top of modal to provide a guide
     * for the user. Name is optional, if not provided, the url link is shown.
     */
    docs?: Array<{ name?: string; url: string }>;

    /**
     * If provided, the forms will be prefilled with the initial values
     */
    prefills?: Partial<IUDFRendererValues>;
}

function indentCode(code: string, numberOfSpaces: number) {
    const spaces = ' '.repeat(numberOfSpaces);
    return code
        .split('\n')
        .map((line) => spaces + line)
        .join('\n');
}

const bigqueryUDFConfig: IUDFEngineConfig = {
    engineLanguage: 'bigquery',
    supportedUDFLanguages: [
        {
            displayName: 'JavaScript',
            name: 'js',
            codeEditorMode: 'javascript',
        },
        {
            displayName: 'SQL',
            name: 'sql',
            codeEditorMode: 'sql',
        },
    ],
    // from https://cloud.google.com/bigquery/docs/reference/standard-sql/data-types
    dataTypes: [
        'STRUCT',
        'ARRAY',
        'BOOL',
        'BYTES',
        'DATE',
        'DATETIME',
        'GEOGRAPHY',
        'INTERVAL',
        'JSON',
        'INT64',
        'INT',
        'SMALLINT',
        'INTEGER',
        'BIGINT',
        'TINYINT',
        'BYTEINT',
        'NUMERIC',
        'DECIMAL',
        'BIGNUMERIC',
        'BIGDECIMAL',
        'FLOAT64',
        'STRING',
        'TIME',
        'TIMESTAMP',
        'ANY TYPE',
    ],

    renderer: (config) => {
        const {
            functionName,
            udfLanguage,
            outputType,
            parameters,
            script,
        } = config;

        /*
            There are 3 parts in UDF generation:
            CREATE FUNC ...    <- create statement
            (parameters) RETURNS type <- udf signature
            LANGUAGE js AS ... <- code
        */

        const createStatement = `CREATE TEMP FUNCTION ${functionName}`;
        let udfSignature = `(${parameters
            .map((param) => `${param.name} ${param.type}`)
            .join(', ')})`;
        let code = '';
        if (udfLanguage === 'sql') {
            if (outputType !== 'ANY TYPE') {
                udfSignature += `\nRETURNS ${outputType}`;
            }
            code = `AS (${script})`;
        } else if (udfLanguage === 'js') {
            udfSignature += `\nRETURNS ${outputType}`;
            code = `LANGUAGE js AS r"""\n${indentCode(script, 4)}\n"""`;
        }

        return `${createStatement}${udfSignature}\n${code};`;
    },

    docs: [
        {
            name: 'BigQuery UDF Guide',
            url:
                'https://cloud.google.com/bigquery/docs/reference/standard-sql/user-defined-functions#sql-udf-structure',
        },
    ],
};

const UDFEngineConfigs: IUDFEngineConfig[] = [bigqueryUDFConfig].concat(
    window.CUSTOM_ENGINE_UDFS ?? []
);

export const UDFEngineConfigsByLanguage = arrayGroupByField(
    UDFEngineConfigs,
    'engineLanguage'
);

export function doesLanguageSupportUDF(language: string) {
    return language in UDFEngineConfigsByLanguage;
}
