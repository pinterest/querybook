import { format } from 'lib/sql-helper/sql-formatter';

const complexQuery =
    "select test_country.country_code, test_country.country_name, sum(users) as test_users from metrics test_metrics left join test.country test_country on test_country.country_code = test_metrics.country where a.dt = '2020-01-01' and test_country.country_code != 'US' group by 1, 2 order by 3 desc limit 30;";

test('Simple formatting case', () => {
    expect(format('select * from test;', 'presto')).toBe(
        `SELECT
  *
FROM
  test;`
    );
    expect(format('select ARRAY [1] || ARRAY [2];', 'presto')).toBe(
        `SELECT
  ARRAY[1] || ARRAY[2];`
    );
});
test('Simple formatting with templating case', () => {
    expect(format('{{ test }};', 'presto')).toBe(`{{ test }};`);
});

test('Simple formatting with templating query case', () => {
    expect(format('select * from {{ test }};', 'presto')).toBe(
        `SELECT
  *
FROM
  {{ test }};`
    );
});
test('formatting with templated hive query case', () => {
    // eslint-disable-next-line
    expect(format('select * from ${ test };', 'hive')).toBe(
        `SELECT
  *
FROM
  \${ test };`
    );
});

test('formatting with templated comment', () => {
    expect(
        format('select {{ test2 }} from {#comment#}{{ test }};', 'hive')
    ).toBe(
        `SELECT
  {{ test2 }}
FROM
  {#comment#}{{ test }};`
    );
});

test('Simple formatting lower case', () => {
    expect(format('select * from test;', 'presto', { case: 'lower' })).toBe(
        `select
  *
from
  test;`
    );
});

test('Simple formatting tab indent', () => {
    expect(format('select * from test;', 'presto', { useTabs: true })).toBe(
        `SELECT
\t*
FROM
\ttest;`
    );
});

test('Simple formatting four space indent', () => {
    expect(format('select * from test;', 'presto', { tabWidth: 4 })).toBe(
        `SELECT
    *
FROM
    test;`
    );
});

test('Multiple statement case', () => {
    expect(format('select * from test;select * from test2;', 'presto')).toBe(
        `SELECT
  *
FROM
  test;
SELECT
  *
FROM
  test2;`
    );
});

test('Complex formatting case', () => {
    expect(format(complexQuery, 'presto')).toBe(`SELECT
  test_country.country_code,
  test_country.country_name,
  sum(users) AS test_users
FROM
  metrics test_metrics
  LEFT JOIN test.country test_country ON test_country.country_code = test_metrics.country
WHERE
  a.dt = '2020-01-01'
  AND test_country.country_code != 'US'
GROUP BY
  1,
  2
ORDER BY
  3 DESC
LIMIT
  30;`);
});

test('Hive Jar Path Case', () => {
    expect(
        format(
            `DELETE JAR s3://test-bucket/hadoopusrs/prod/test-0.5-SNAPSHOT/test-0.5-SNAPSHOT.jar;
ADD JAR s3://test-bucket/hadoopusrs/bob/test-0.5-SNAPSHOT/test-0.5-SNAPSHOT.jar;`,
            'hive'
        )
    ).toBe(
        `DELETE JAR s3://test-bucket/hadoopusrs/prod/test-0.5-SNAPSHOT/test-0.5-SNAPSHOT.jar;
ADD JAR s3://test-bucket/hadoopusrs/bob/test-0.5-SNAPSHOT/test-0.5-SNAPSHOT.jar;`
    );
});

test('Bitwise select case', () => {
    expect(format('SELECT ~0, 5 & 6;', 'hive')).toBe(
        `SELECT
  ~ 0,
  5 & 6;`
    );
});

test('Bitwise where case', () => {
    expect(
        format('select * from example where field & 123456 = 0;', 'hive')
    ).toBe(
        `SELECT
  *
FROM
  example
WHERE
  field & 123456 = 0;`
    );
});

test('Do not remove unknown symbols', () => {
    expect(format('¡™£¢∞§¶•ªº', 'mysql')).toBe('¡™£¢∞§¶•ªº');
});
