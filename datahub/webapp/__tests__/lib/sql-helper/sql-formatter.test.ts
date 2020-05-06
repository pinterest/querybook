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
    expect(format('select * from test;', 'presto', { indent: '\t' })).toBe(
        `SELECT
\t*
FROM
\ttest;`
    );
});

test('Simple formatting four space indent', () => {
    expect(format('select * from test;', 'presto', { indent: '    ' })).toBe(
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
