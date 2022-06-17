import { isEmpty } from 'lodash';
import { useCallback, useMemo } from 'react';

import { useDebounce } from 'hooks/useDebounce';
import { useImmer } from 'hooks/useImmer';

export interface ITableColumnFilter<T = string> {
    name: string;
    filter: (cell: T, conditions: string[]) => boolean;
    numInputs: number;
}

const stringTableColumnFilters = new Map<string, ITableColumnFilter>(
    (
        [
            {
                name: 'contains',
                filter: (cell, conditions) => {
                    const containsStr = conditions[0];
                    return cell.includes(containsStr);
                },
                numInputs: 1,
            },
            {
                name: 'does not contain',
                filter: (cell, conditions) => {
                    const containsStr = conditions[0];
                    return !cell.includes(containsStr);
                },
                numInputs: 1,
            },
            {
                name: 'equals',
                filter: (cell, conditions) => cell === conditions[0],
                numInputs: 1,
            },
            {
                name: 'not equals',
                filter: (cell, conditions) => cell !== conditions[0],
                numInputs: 1,
            },
            {
                name: 'starts with',
                filter: (cell, conditions) => cell.startsWith(conditions[0]),
                numInputs: 1,
            },
            {
                name: 'ends with',
                filter: (cell, conditions) => cell.endsWith(conditions[0]),
                numInputs: 1,
            },
        ] as ITableColumnFilter[]
    ).map((item) => [item.name, item])
);

const numberTableColumnFilters = new Map<string, ITableColumnFilter>(
    (
        [
            {
                name: 'equals',
                filter: (cell, conditions) => cell === conditions[0],
                numInputs: 1,
            },
            {
                name: 'not equals',
                filter: (cell, conditions) => cell !== conditions[0],
                numInputs: 1,
            },
            {
                name: 'greater than',
                filter: (cell, conditions) =>
                    Number(cell) > Number(conditions[0]),
                numInputs: 1,
            },
            {
                name: 'less than',
                filter: (cell, conditions) =>
                    Number(cell) < Number(conditions[0]),
                numInputs: 1,
            },
            {
                name: 'between',
                filter: (cell, conditions) =>
                    Number(conditions[0]) < Number(cell) &&
                    Number(cell) < Number(conditions[1]),
                numInputs: 2,
            },
        ] as ITableColumnFilter[]
    ).map((item) => [item.name, item])
);

export const tableColumnFiltersByType = {
    str: stringTableColumnFilters,
    num: numberTableColumnFilters,
};

export interface IFilterCondition {
    type: keyof typeof tableColumnFiltersByType;
    name: string;
    conditions: string[];
}

export function useFilterCell(rows: string[][]) {
    const [filterConditionByColumn, setFilterConditionByColumn] = useImmer<
        Record<number, IFilterCondition>
    >({});
    const setFilterCondition = useCallback(
        (colIndex: number, condition: IFilterCondition | null) => {
            setFilterConditionByColumn((draft) => {
                if (!condition) {
                    delete draft[colIndex];
                } else {
                    draft[colIndex] = condition;
                }
            });
        },
        []
    );

    const debouncedFilterConditionByColumn = useDebounce(
        filterConditionByColumn,
        500
    );

    const filteredRows = useMemo(() => {
        if (isEmpty(debouncedFilterConditionByColumn)) {
            return rows;
        }
        const filterConditions = Object.entries(
            debouncedFilterConditionByColumn
        );

        return rows.filter((row) =>
            filterConditions.every(([colIndex, filterCondition]) => {
                const cell = row[colIndex];

                // If inputs are empty, then don't do any filtering
                if (!conditionsNotEmpty(filterCondition)) {
                    return true;
                }

                return tableColumnFiltersByType[filterCondition.type]
                    .get(filterCondition.name)
                    .filter(cell, filterCondition.conditions);
            })
        );
    }, [rows, debouncedFilterConditionByColumn]);

    return {
        filteredRows,
        setFilterCondition,
        filterConditionByColumn,
    };
}

export function conditionsNotEmpty(filterCondition: IFilterCondition) {
    return !!filterCondition?.conditions.every((cond) => cond.length > 0);
}
