import { useDispatch, useSelector } from 'react-redux';
import { fetchDataTableIfNeeded } from 'redux/dataSources/action';
import { fullTableSelector } from 'redux/dataSources/selector';
import { IStoreState } from 'redux/store/types';

/**
 * Provide getter for fetching and displaying a table, use with <Loader /> component
 * @param tableId the id of a data table
 */
export function useDataTable(tableId: number) {
    const { table, schema, tableColumns } = useSelector((state: IStoreState) =>
        fullTableSelector(state, tableId)
    );

    const dispatch = useDispatch();

    const getTable = () => dispatch(fetchDataTableIfNeeded(tableId));

    return {
        getTable,

        table,
        schema,
        tableColumns,
    };
}
