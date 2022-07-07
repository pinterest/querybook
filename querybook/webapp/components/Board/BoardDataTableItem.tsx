import { ContentState } from 'draft-js';
import * as React from 'react';
import { useDispatch } from 'react-redux';

import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { fetchDataTableIfNeeded } from 'redux/dataSources/action';
import { Dispatch, IStoreState } from 'redux/store/types';

import { BoardItem } from './BoardItem';

interface IProps {
    itemId: number;
    tableId: number;
}

export const BoardDataTableItem: React.FunctionComponent<IProps> = ({
    itemId,
    tableId,
}) => {
    const { table, schema } = useShallowSelector((state: IStoreState) => {
        const tableFromState = state.dataSources.dataTablesById[tableId];
        const schemaFromState = tableFromState
            ? state.dataSources.dataSchemasById[tableFromState.schema]
            : null;

        return {
            table: tableFromState,
            schema: schemaFromState,
        };
    });

    const dispatch: Dispatch = useDispatch();

    React.useEffect(() => {
        dispatch(fetchDataTableIfNeeded(tableId));
    }, [tableId]);

    return table ? (
        <BoardItem
            boardItemId={itemId}
            itemId={table.id}
            itemType="table"
            title={`${schema?.name}.${table.name}`}
            titleUrl={`/table/${table.id}/`}
            description={table.description as ContentState}
        />
    ) : null;
};
