import React, { useCallback, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { IStoreState, Dispatch } from 'redux/store/types';
import { fetchTopQueryEnginesIfNeeded } from 'redux/dataSources/action';

import { Loading } from 'ui/Loading/Loading';
import { Button } from 'ui/Button/Button';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';

export function useLoadQueryEngines(tableId: number) {
    const [loading, setLoading] = useState(false);
    const topQueryEngines = useSelector(
        (state: IStoreState) =>
            state.dataSources.queryTopEnginesByTableId[tableId]
    );

    const dispatch: Dispatch = useDispatch();

    useEffect(() => {
        setLoading(true);
        dispatch(fetchTopQueryEnginesIfNeeded(tableId)).finally(() => {
            setLoading(false);
        });
    }, [tableId]);

    return {
        loading,
        topQueryEngines,
    };
}

export const DataTableViewQueryEngines: React.FC<{
    tableId: number;
    onClick?: (engineId: number) => any;
    selectedEngineId?: number;
}> = ({ tableId, onClick = null, selectedEngineId }) => {
    const { loading, topQueryEngines } = useLoadQueryEngines(tableId);

    const enginesDOM = loading ? (
        <Loading />
    ) : !topQueryEngines?.length ? (
        <div>
            This table has not been queried by any engines in this environment.
        </div>
    ) : (
        <div className="query-filter-wrapper">
            {topQueryEngines.map(({ engine_id: engineId, count }) => (
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
    const queryEngine = queryEngineById[engineId];
    const { name: queryEngineName } = queryEngine;

    return (
        <Button onClick={handleClick} active={active}>
            <span className="ml4">
                {queryEngineName} ({queryCount})
            </span>
        </Button>
    );
};
