import { getSelectStatementLimit } from 'lib/sql-helper/sql-limiter';

describe('getSelectStatementLimit', () => {
    describe('when it is not a SELECT statement', () => {
        test('DELETE', () => {
            const query = 'DELETE FROM table_1 WHERE field = 1;';
            expect(getSelectStatementLimit(query)).toBeNull();
        });
        test('when running a delete query', () => {
            const query = 'DELETE FROM table_1 WHERE field = 1;';
            expect(getSelectStatementLimit(query)).toBeNull();
        });

        test('when running a create database query', () => {
            const query = 'CREATE DATABASE IF NOT EXISTS db_1;';
            expect(getSelectStatementLimit(query)).toBeNull();
        });
        test('when running a create table query', () => {
            const query = 'CREATE TABLE table_1 (field1 INT);';
            expect(getSelectStatementLimit(query)).toBeNull();
        });
        test('when truncating a table', () => {
            const query = 'TRUNCATE TABLE table_1;';
            expect(getSelectStatementLimit(query)).toBeNull();
        });
        test('when running a drop and create database query', () => {
            const query = `
                drop table if exists db.table1;
                create table db.table1;
            `;
            expect(getSelectStatementLimit(query)).toBeNull();
        });
        test('when running an insert query', () => {
            const query = 'INSERT INTO table_1 (field1) VALUES (1);';
            expect(getSelectStatementLimit(query)).toBeNull();
        });
        test('when running an update query', () => {
            const query = 'UPDATE table_1 SET field1 = 1 WHERE field = 1;';
            expect(getSelectStatementLimit(query)).toBeNull();
        });
    });
    describe('select statement without limits', () => {
        test('select with join and groupby', () => {
            const query =
                'SELECT max(field) FROM tbl JOIN (SELECT * FROM tbl2) t2 ON tbl.a = t2.b GROUP BY c';
            expect(getSelectStatementLimit(query)).toBe(-1);
        });
    });

    describe('correctly extract limit', () => {
        test('select with where, join, group by, and having', () => {
            const query =
                'SELECT max(field) FROM tbl JOIN (SELECT * FROM tbl2 LIMIT 10) t2 ON tbl.a = t2.b GROUP BY c HAVING max(field) < 2 LIMIT 10';
            expect(getSelectStatementLimit(query)).toBe(10);
        });
        test('when running a select query with fetch', () => {
            const query =
                'SELECT * FROM table_1 ORDER BY id FETCH FIRST 10 ROWS ONLY;';
            expect(getSelectStatementLimit(query, 'trino')).toBe(10);
        });
        test('when running a select query with offset and fetch', () => {
            const query =
                'SELECT * FROM table_1 ORDER BY id OFFSET 10 FETCH NEXT 20 ROWS ONLY;';
            expect(getSelectStatementLimit(query, 'trino')).toBe(20);
        });
        test('when running a select query with nested query', () => {
            const query = `select * from (select * from table limit 5) as x limit 10`;
            expect(getSelectStatementLimit(query, 'trino')).toBe(10);
        });
        test('when running a select query with a where clause and a limit', () => {
            const query = 'SELECT * FROM table_1 WHERE field = 1 LIMIT 1000;';
            expect(getSelectStatementLimit(query, 'trino')).toBe(1000);
        });
    });
});
