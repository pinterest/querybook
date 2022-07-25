import { getDroppedTables } from 'lib/sql-helper/sql-checker';

describe('getDroppedTables', () => {
    test('drops tables', () => {
        const query = `
        drop table db.table1;
        drop table db.table2;
    `;
        expect(getDroppedTables(query)).toStrictEqual([
            'db.table1',
            'db.table2',
        ]);
    });

    test('drops tables with if exists', () => {
        const query = `
        drop table if exists db.table1;
        drop table if exists db.table2;
    `;
        expect(getDroppedTables(query)).toStrictEqual([
            'db.table1',
            'db.table2',
        ]);
    });

    test('drops a table and recreated', () => {
        const query1 = `
        drop table if exists db.table1;
        create table db.table1 if not exists;
    `;
        expect(getDroppedTables(query1)).toStrictEqual([]);

        // with `external`
        const query2 = `
        drop table if exists db.table1;
        create external table db.table1 if not exists;
    `;
        expect(getDroppedTables(query2)).toStrictEqual([]);
    });

    test('drops more tables than recreated', () => {
        const query = `
        drop table if exists db.table1;
        drop table db.table2;
        create table db.table1 if not exists;
    `;
        expect(getDroppedTables(query)).toStrictEqual(['db.table2']);
    });

    test('drops tables with use', () => {
        const query = `
        use db;
        drop table if exists table1;
        drop table table2;
        create table db.table1 if not exists;
    `;
        expect(getDroppedTables(query)).toStrictEqual(['db.table2']);
    });
});
