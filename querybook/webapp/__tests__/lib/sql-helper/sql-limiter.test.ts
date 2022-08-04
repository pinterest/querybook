import { getLimitedQuery } from 'lib/sql-helper/sql-limiter';

describe('getLimitedQuery', () => {
    describe('not limited', () => {
        test('when rowLimit is not specified', () => {
            const query = 'SELECT * FROM table_1 WHERE field = 1;';
            expect(getLimitedQuery(query)).toBe(query);
        });
        test('when rowLimit is not specified for multiple queries', () => {
            const query = `
                SELECT * FROM table_1 WHERE field = 1;
                SELECT * FROM table_1 WHERE field = 1;
            `;
            expect(getLimitedQuery(query)).toBe(query);
        });
        test('when running a delete query', () => {
            const query = 'DELETE FROM table_1 WHERE field = 1;';
            expect(getLimitedQuery(query, 100)).toBe(query);
        });
        test('when running a select query with a where clause and a limit', () => {
            const query = 'SELECT * FROM table_1 WHERE field = 1 LIMIT 1000;';
            expect(getLimitedQuery(query, 100)).toBe(query);
        });
        test('when running a select query with a where clause and a group by and an order by', () => {
            const query =
                'SELECT field, count(*) FROM table_1 WHERE deleted = false GROUP BY field ORDER BY field';
            expect(getLimitedQuery(query, 100)).toBe(`${query} limit 100;`);
        });
        test('when running a create database query', () => {
            const query = 'CREATE DATABASE IF NOT EXISTS db_1;';
            expect(getLimitedQuery(query, 100)).toBe(query);
        });
        test('when running a create table query', () => {
            const query = 'CREATE TABLE table_1 (field1 INT);';
            expect(getLimitedQuery(query, 100)).toBe(query);
        });
        test('when truncating a table', () => {
            const query = 'TRUNCATE TABLE table_1;';
            expect(getLimitedQuery(query, 100)).toBe(query);
        });
        test('when running a drop and create database query', () => {
            const query = `
                drop table if exists db.table1;
                create table db.table1;
            `;
            expect(getLimitedQuery(query, 100)).toBe(query);
        });
        test('when running an insert query', () => {
            const query = 'INSERT INTO table_1 (field1) VALUES (1);';
            expect(getLimitedQuery(query, 100)).toBe(query);
        });
        test('when running an update query', () => {
            const query = 'UPDATE table_1 SET field1 = 1 WHERE field = 1;';
            expect(getLimitedQuery(query, 100)).toBe(query);
        });
        test('when running a select query with fetch', () => {
            const query =
                'SELECT * FROM table_1 ORDER BY id FETCH FIRST 10 ROWS ONLY;';
            expect(getLimitedQuery(query, 100, 'trino')).toBe(query);
        });
        test('when running a select query with offset and fetch', () => {
            const query =
                'SELECT * FROM table_1 ORDER BY id OFFSET 10 FETCH NEXT 10 ROWS ONLY;';
            expect(getLimitedQuery(query, 100, 'trino')).toBe(query);
        });
    });
    describe('limited', () => {
        test('when running a select query', () => {
            const query = 'SELECT * FROM table_1';
            expect(getLimitedQuery(query, 10)).toBe(`${query} limit 10;`);
        });
        test('when running a select query with trailing semicolon', () => {
            const query = 'SELECT * FROM table_1;';
            expect(getLimitedQuery(query, 10)).toBe(
                'SELECT * FROM table_1 limit 10;'
            );
        });
        test('when running a select query with comments', () => {
            const query = 'SELECT * FROM table_1 -- limit here';
            expect(getLimitedQuery(query, 10)).toBe(
                'SELECT * FROM table_1 limit 10;'
            );
        });
        test('when running a select query with non-keyword limits', () => {
            const query = `SELECT id, account, 'limit' FROM querybook2.limit ORDER by 'limit' ASC`;
            expect(getLimitedQuery(query, 10)).toBe(`${query} limit 10;`);
        });
        test('when running a multiple select queries', () => {
            const query = `SELECT * FROM table_1;
SELECT col1, col2, FROM table2;`;
            expect(getLimitedQuery(query, 10)).toBe(
                `SELECT * FROM table_1 limit 10;
SELECT col1, col2, FROM table2 limit 10;`
            );
        });
        test('when running a select query with a where clause', () => {
            const query = 'SELECT * FROM table_1 WHERE field = 1';
            expect(getLimitedQuery(query, 100)).toBe(`${query} limit 100;`);
        });
        test('when running a select query with a where clause and an order by', () => {
            const query =
                'SELECT * FROM table_1 WHERE field = 1 ORDER BY field';
            expect(getLimitedQuery(query, 100)).toBe(`${query} limit 100;`);
        });
        test('when running a select query with a where clause and a group by and an order by', () => {
            const query =
                'SELECT field, count(*) FROM table_1 WHERE deleted = false GROUP BY field ORDER BY field';
            expect(getLimitedQuery(query, 100)).toBe(`${query} limit 100;`);
        });
        test('when running two select queries with mixed limits', () => {
            const query = `SELECT * FROM table_1;
SELECT col1, col2, FROM table2 LIMIT 300;`;
            expect(getLimitedQuery(query, 10))
                .toBe(`SELECT * FROM table_1 limit 10;
SELECT col1, col2, FROM table2 LIMIT 300;`);
        });
        test('when running multiple select queries with mixed limits', () => {
            const query = `SELECT * FROM table_1;
SELECT col1, col2, FROM table2 LIMIT 300;
SELECT field, count(1) FROM table3 GROUP BY field`;
            expect(getLimitedQuery(query, 10))
                .toBe(`SELECT * FROM table_1 limit 10;
SELECT col1, col2, FROM table2 LIMIT 300;
SELECT field, count(1) FROM table3 GROUP BY field limit 10;`);
        });
    });
});
