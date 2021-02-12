import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchDataTableIfNeeded } from 'redux/dataSources/action';
import { fullTableSelector } from 'redux/dataSources/selector';
import { IStoreState } from 'redux/store/types';
import { Loader } from 'ui/Loader/Loader';

export const TableName: React.FC<{ tableId: number }> = ({ tableId }) => {
    const { table, schema } = useSelector((state: IStoreState) =>
        fullTableSelector(state, tableId)
    );

    const dispatch = useDispatch();
    const loadTable = useCallback(
        () => dispatch(fetchDataTableIfNeeded(tableId)),
        [tableId]
    );

    return (
        <Loader
            item={table && schema}
            itemKey={tableId}
            itemLoader={loadTable}
            placeHolder={'Loading...'}
            renderer={() => `${schema.name}.${table.name}`}
        />
    );
};
