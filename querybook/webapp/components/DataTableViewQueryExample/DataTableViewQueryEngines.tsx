import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchTableQueryEnginesIfNeeded } from 'redux/dataSources/action';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Button } from 'ui/Button/Button';
import { Loading } from 'ui/Loading/Loading';
import { EmptyText } from 'ui/StyledText/StyledText';
import { Tag } from 'ui/Tag/Tag';

export function useLoadQueryEngines(tableId: number) {
    const [loading, setLoading] = useState(false);
    const queryEngines = useSelector(
        (state: IStoreState) =>
            state.dataSources.queryEnginesByTableId[tableId] ?? []
    );

    const dispatch: Dispatch = useDispatch();

    useEffect(() => {
        setLoading(true);
        dispatch(fetchTableQueryEnginesIfNeeded(tableId)).finally(() => {
            setLoading(false);
        });
    }, [tableId]);

    return {
        loading,
        queryEngines,
    };
}

export const DataTableViewQueryEngines: React.FC<{
    tableId: number;
    onClick?: (engineId: number) => any;
    selectedEngineId?: number;
}> = ({ tableId, onClick = null, selectedEngineId }) => {
    const { loading, queryEngines } = useLoadQueryEngines(tableId);

    const enginesDOM = loading ? (
        <Loading />
    ) : !queryEngines?.length ? (
        <EmptyText size="small" center={false}>
            This table has not been queried by any engines in this environment
        </EmptyText>
    ) : (
        <div className="query-filter-wrapper">
            {queryEngines.map(({ engine_id: engineId, count }) => (
                <QueryEngineButton
                    key={engineId}
                    engineId={engineId}
                    queryCount={count}
                    onClick={onClick}
                    active={selectedEngineId === engineId}
                />
            ))}
        </div>
    );

    return <div className="DataTableViewQueryEngines">{enginesDOM}</div>;
};

const QueryEngineButton: React.FC<{
    engineId: number;
    onClick?: (engineId: number) => void;
    queryCount: number;
    active: boolean;
}> = ({ engineId, onClick, queryCount, active }) => {
    const handleClick = useCallback(
        () => onClick?.(engineId),
        [onClick, engineId]
    );
    const queryEngineById = useSelector(queryEngineByIdEnvSelector);
    const queryEngineName = queryEngineById[engineId].name;

    return (
        <Button onClick={handleClick} active={active}>
            <Tag highlighted={active}>{queryEngineName}</Tag>
            <Tag highlighted={active}>{queryCount}</Tag>
        </Button>
    );
};
