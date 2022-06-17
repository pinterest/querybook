import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchTopQueryConcurrencesIfNeeded } from 'redux/dataSources/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Button } from 'ui/Button/Button';
import { Loading } from 'ui/Loading/Loading';
import { EmptyText } from 'ui/StyledText/StyledText';
import { Tag } from 'ui/Tag/Tag';

import { TableName } from './DataTableName';

export function useLoadQueryConcurrences(tableId: number) {
    const [loading, setLoading] = useState(false);
    const topConcurrences = useSelector(
        (state: IStoreState) =>
            state.dataSources.queryTopConcurrencesByTableId[tableId]
    );

    const dispatch: Dispatch = useDispatch();

    useEffect(() => {
        setLoading(true);
        dispatch(fetchTopQueryConcurrencesIfNeeded(tableId)).finally(() => {
            setLoading(false);
        });
    }, [tableId]);

    return {
        loading,
        topConcurrences,
    };
}

export const DataTableViewQueryConcurrences: React.FC<{
    tableId: number;
    onClick?: (tableId: number) => any;
    selectedTableId?: number;
}> = ({ tableId, onClick = null, selectedTableId }) => {
    const { loading, topConcurrences } = useLoadQueryConcurrences(tableId);

    const tablesDOM = loading ? (
        <Loading />
    ) : !topConcurrences?.length ? (
        <EmptyText size="small" center={false}>
            Cannot find examples where this table is used with others
        </EmptyText>
    ) : (
        <div className="query-filter-wrapper">
            {topConcurrences.map(({ table_id: tableId, count }) => (
                <QueryTableButton
                    tableId={tableId}
                    queryCount={count}
                    key={tableId}
                    onClick={onClick}
                    active={selectedTableId === tableId}
                />
            ))}
        </div>
    );

    return <div className="DataTableViewQueryConcurrences">{tablesDOM}</div>;
};

const QueryTableButton: React.FC<{
    tableId: number;
    onClick?: (tableId: number) => void;
    queryCount: number;
    active: boolean;
}> = ({ tableId, onClick, queryCount, active }) => {
    const handleClick = useCallback(
        () => onClick?.(tableId),
        [onClick, tableId]
    );

    return (
        <Button onClick={handleClick} active={active}>
            <Tag highlighted={active}>
                <TableName tableId={tableId} />
            </Tag>
            <Tag highlighted={active}>{queryCount}</Tag>
        </Button>
    );
};
