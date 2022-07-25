import { getDroppedTables } from 'lib/sql-helper/sql-checker';

describe('getDroppedTables', () => {
    test('drops a table', () => {
        const query = `
        drop table db.table1;
        drop table db.table2;
    `;
        expect(getDroppedTables(query)).toStrictEqual([
            'db.table1',
            'db.table2',
        ]);
    });

    test('drops a table and created', () => {
        const query1 = `
        drop table db.table1 if exists;
        create table db.table1 if not exists;
    `;
        expect(getDroppedTables(query1)).toStrictEqual([]);

        // with `external`
        const query2 = `
        drop table db.table1 if exists;
        create external table db.table1 if not exists;
    `;
        expect(getDroppedTables(query2)).toStrictEqual([]);
    });

    test('drops more tables than recreated', () => {
        const query = `
        drop table db.table1 if exists;
        drop table db.table2;
        create table db.table1 if not exists;
    `;
        expect(getDroppedTables(query)).toStrictEqual(['db.table2']);
    });

    test('drops tables with use', () => {
        const query = `
        use db;
        drop table table1 if exists;
        drop table table2;
        create table db.table1 if not exists;
    `;
        expect(getDroppedTables(query)).toStrictEqual(['db.table2']);
    });
});
