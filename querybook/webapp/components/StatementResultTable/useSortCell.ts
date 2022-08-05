import { useCallback, useMemo } from 'react';

import { isCellValNull } from 'lib/query-result/helper';
import { isNumeric } from 'lib/utils/number';

export type ColumnSortType = 'string' | 'number';

export function useSortCell(rows: string[][]) {
    const columnTypeCache: Record<number, ColumnSortType> = useMemo(
        () => ({}),
        [rows]
    );

    const sortCell = useCallback(
        (colIdx: number, a: any, b: any) => {
            if (isCellValNull(a)) {
                return -1;
            } else if (isCellValNull(b)) {
                return 1;
            }

            if (!(colIdx in columnTypeCache)) {
                columnTypeCache[colIdx] = getColumnType(rows, colIdx);
            }

            const colType = columnTypeCache[colIdx];
            if (colType === 'number') {
                a = Number(a);
                b = Number(b);
            }
            return a < b ? -1 : a > b ? 1 : 0;
        },
        [rows, columnTypeCache]
    );
    return sortCell;
}

function getColumnType(rows: any[][], colIdx: number): ColumnSortType {
    for (const row of rows) {
        const cell = row[colIdx];
        if (isCellValNull(cell)) {
            continue;
        } else if (!isNumeric(cell)) {
            return 'string';
        }
    }
    return 'number';
}
