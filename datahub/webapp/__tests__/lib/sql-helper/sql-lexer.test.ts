import {
    findTableReferenceAndAlias,
    getQueryAsExplain,
    getQueryLinePosition,
    simpleParse,
    tokenize,
} from 'lib/sql-helper/sql-lexer';

const simpleQuery = `
SELECT
  aa.a,
  aa.b
FROM
  table_a aa
  JOIN table_b bb ON aa.a = bb.b
WHERE
  aa.b = 3
ORDER BY
  bb.b
LIMIT
  5
`;

test('tokenize', () => {
    expect(tokenize('select * from table where a = 5;')).toMatchSnapshot();
    expect(tokenize(simpleQuery)).toMatchSnapshot();
});

test('simpleParse', () => {
    expect(
        simpleParse(
            tokenize(`
    select * from table where fielda = 5;
    select * from table where fieldb = (select fielda from table where fieldb = 5);
    `)
        )
    ).toMatchSnapshot();

    expect(
        simpleParse(
            tokenize(`select * from table where extract(YEAR FROM fielda) = 5;`)
        )
    ).toMatchSnapshot();
});

test('findTableReferenceAndAlias', () => {
    const tokenTableA = {
        end: 9,
        line: 5,
        name: 'table_a',
        schema: 'default',
        start: 2,
    };
    const tokenTableB = {
        end: 14,
        line: 6,
        name: 'table_b',
        schema: 'default',
        start: 7,
    };

    expect(
        findTableReferenceAndAlias(simpleParse(tokenize(simpleQuery)))
    ).toEqual({
        aliases: {
            0: {
                aa: tokenTableA,
                bb: tokenTableB,
            },
        },
        references: { 0: [tokenTableA, tokenTableB] },
    });

    expect(
        findTableReferenceAndAlias(
            simpleParse(
                tokenize(
                    `
SELECT *
FROM table_2
JOIN table_1 ON table_1.field_1 = table_2.field_2
AND extract(YEAR FROM field_1_date) = table_2.field_year`
                )
            )
        )
    ).toEqual({
        aliases: { 0: {} },
        references: {
            0: [
                {
                    end: 12,
                    line: 2,
                    name: 'table_2',
                    schema: 'default',
                    start: 5,
                },
                {
                    end: 12,
                    line: 3,
                    name: 'table_1',
                    schema: 'default',
                    start: 5,
                },
            ],
        },
    });

    expect(
        findTableReferenceAndAlias(
            simpleParse(
                tokenize(
                    `
with table_3 as (
    SELECT * from table_4
)
SELECT *
FROM table_2
WHERE table_2.field_1 = (
    SELECT SUM(table_1.field_3)
    FROM table_1 JOIN table_3 ON table_1.field_3 = table_3.field_2
    WHERE table_1.field_1 = table_2.field_2
)`
                )
            )
        )
    ).toEqual({
        aliases: { 0: {} },
        references: {
            0: [
                {
                    end: 25,
                    line: 2,
                    name: 'table_4',
                    schema: 'default',
                    start: 18,
                },
                {
                    end: 12,
                    line: 5,
                    name: 'table_2',
                    schema: 'default',
                    start: 5,
                },
                {
                    end: 16,
                    line: 8,
                    name: 'table_1',
                    schema: 'default',
                    start: 9,
                },
            ],
        },
    });
});

test('getQueryAsExplain', () => {
    expect(getQueryAsExplain('select 1')).toBe('EXPLAIN select 1;');
    expect(
        getQueryAsExplain(
            `select 1; --ignore
select 2;
select 3 --test`
        )
    ).toBe(
        `EXPLAIN select 1;
EXPLAIN select 2;
EXPLAIN select 3;`
    );
});

test('getQueryLinePosition', () => {
    expect(
        getQueryLinePosition(
            `SELECT *
FROM
    table_a;`
        )
    ).toStrictEqual([0, 9, 14, 27]);
});
