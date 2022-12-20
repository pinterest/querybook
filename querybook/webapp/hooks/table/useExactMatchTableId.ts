import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { useMemo } from 'react';
import { IStoreState } from 'redux/store/types';

export function useExactMatchTableId() {
    const { dataTables, searchString, searchFilters } = useShallowSelector(
        (state: IStoreState) => ({
            dataTables: state.dataTableSearch.results,
            searchString: state.dataTableSearch.searchString,
            searchFilters: state.dataTableSearch.searchFilters,
        })
    );

    const [searchStringSchema, searchStringTable] = useMemo(() => {
        const trimmedStr = searchString.trim();
        const separatedStrs = trimmedStr.split('.');

        if (separatedStrs.length > 2) {
            return [null, null];
        }

        if (separatedStrs.length === 1) {
            return [searchFilters.schema, separatedStrs[0]];
        } else if (separatedStrs.length === 2) {
            return separatedStrs;
        }
    }, [searchString, searchFilters]);

    const exactMatchTableId = useMemo(() => {
        if (!searchStringSchema || !searchStringTable) {
            return null;
        }

        return dataTables.find(
            (table) =>
                table.name === searchStringTable &&
                table.schema === searchStringSchema
        )?.id;
    }, [searchStringSchema, searchStringTable, dataTables]);

    return exactMatchTableId;
}
