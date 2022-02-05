import { UDFEngineConfigsByLanguage } from 'lib/utils/udf';

const bigqueryUDFConfig = UDFEngineConfigsByLanguage['bigquery'];

test('BigQuery SQL UDF', () => {
    expect(
        bigqueryUDFConfig.renderer({
            functionName: 'AddFourAndDivide',
            parameters: [
                {
                    name: 'x',
                    type: 'INT64',
                },
                {
                    name: 'y',
                    type: 'INT64',
                },
            ],
            outputType: 'FLOAT64',
            script: '(x + 4) / y',
            udfLanguage: 'sql',
        })
    ).toEqual(
        `CREATE TEMP FUNCTION AddFourAndDivide(x INT64, y INT64)
RETURNS FLOAT64
AS ((x + 4) / y);`
    );
});

test('BigQuery Javascript UDF', () => {
    expect(
        bigqueryUDFConfig.renderer({
            functionName: 'multiplyInputs',
            parameters: [
                {
                    name: 'x',
                    type: 'FLOAT64',
                },
                {
                    name: 'y',
                    type: 'FLOAT64',
                },
            ],
            outputType: 'FLOAT64',
            script: 'return x*y;',
            udfLanguage: 'js',
        })
    ).toEqual(
        `CREATE TEMP FUNCTION multiplyInputs(x FLOAT64, y FLOAT64)
RETURNS FLOAT64
LANGUAGE js AS r"""
    return x*y;
""";`
    );
});
