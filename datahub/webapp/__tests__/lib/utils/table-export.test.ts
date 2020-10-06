import { tableToCSV, tableToTSV } from 'lib/utils/table-export';
const table = [
    ['column1', 'column2', 'column3'],
    ['1', '2', '3'],
    ['test"', 'test2    ', 'test3\t\t\n'],
];

test('table to tsv', () => {
    expect(tableToTSV(table)).toEqual(
        `column1\tcolumn2\tcolumn3
1\t2\t3
test"\ttest2    \ttest3   `
    );
});

test('table to csv', () => {
    expect(tableToCSV(table)).toEqual(
        `"column1","column2","column3"
"1","2","3"
"test""","test2    ","test3		 "`
    );
});
