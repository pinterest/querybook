import { getPossibleTranspilers } from 'lib/templated-query/transpile';

describe('getPossibleTranspilers tests', () => {
    const transpilers = [
        {
            name: 'foo',
            from_languages: ['mysql', 'presto'],
            to_languages: ['presto', 'spark'],
        },
        {
            name: 'bar',
            from_languages: ['mysql', 'presto'],
            to_languages: ['hive'],
        },
    ];
    const queryEngines = [
        {
            id: 0,
            name: 'mysql',
            language: 'mysql',
            description: '',

            metastore_id: 1,
            executor: 'sqlalchemy',

            feature_params: {},
        },
        {
            id: 1,
            name: 'presto',
            language: 'presto',
            description: '',

            metastore_id: 1,
            executor: 'sqlalchemy',

            feature_params: {},
        },
        {
            id: 1,
            name: 'hive',
            language: 'hive',
            description: '',

            metastore_id: 1,
            executor: 'sqlalchemy',

            feature_params: {},
        },
        {
            id: 2,
            name: 'presto2',
            language: 'presto',
            description: '',

            metastore_id: 1,
            executor: 'sqlalchemy',

            feature_params: {},
        },
    ];

    test('mysql -> presto x2, mysql -> hive', () => {
        expect(
            getPossibleTranspilers(transpilers, queryEngines[0], queryEngines)
        ).toEqual([
            {
                transpilerName: 'foo',
                toEngine: queryEngines[1],
            },
            {
                transpilerName: 'bar',
                toEngine: queryEngines[2],
            },
            {
                transpilerName: 'foo',
                toEngine: queryEngines[3],
            },
        ]);
    });

    test('presto -> hive', () => {
        expect(
            getPossibleTranspilers(transpilers, queryEngines[1], queryEngines)
        ).toEqual([
            {
                transpilerName: 'bar',
                toEngine: queryEngines[2],
            },
        ]);
    });

    test('hive -> none', () => {
        expect(
            getPossibleTranspilers(transpilers, queryEngines[2], queryEngines)
        ).toEqual([]);
    });
});
