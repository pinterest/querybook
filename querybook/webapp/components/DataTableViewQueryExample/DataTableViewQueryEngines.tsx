import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { IStoreState, Dispatch } from 'redux/store/types';
import { fetchTableQueryEnginesIfNeeded } from 'redux/dataSources/action';

import { Loading } from 'ui/Loading/Loading';
import { Button } from 'ui/Button/Button';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';

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
        <div>
            This table has not been queried by any engines in this environment.
        </div>
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
    const handleClick = useCallback(() => onClick?.(engineId), [
        onClick,
        engineId,
    ]);
    const queryEngineById = useSelector(queryEngineByIdEnvSelector);
    const queryEngineName = queryEngineById[engineId].name;

    return (
        <Button onClick={handleClick} active={active}>
            {queryEngineName} ({queryCount})
        </Button>
    );
};
