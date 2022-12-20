import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { useMemo } from 'react';
import { IStoreState } from 'redux/store/types';

export function useExactMatchTableId() {
    const { dataTables, searchString } = useShallowSelector(
        (state: IStoreState) => ({
            dataTables: state.dataTableSearch.results,
            searchString: state.dataTableSearch.searchString,
        })
    );

    const [searchStringSchema, searchStringTable] = useMemo(() => {
        const trimmedStr = searchString.trim();
        if (!trimmedStr.match(/^\w+\.\w+$/)) {
            return [null, null];
        }
        return trimmedStr.split('.');
    }, [searchString]);

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
