import * as React from 'react';

import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';
import { Loading, LoadingIcon } from 'ui/Loading/Loading';
import { renderStatValue } from './DataTableStatsCommon';
import { useDispatch, useSelector } from 'react-redux';
import { IStoreState, Dispatch } from 'redux/store/types';
import { fetchDataTableStatsIfNeeded } from 'redux/dataSources/action';

interface IProps {
    tableId: number;
}

export function useFetchDataTableStats(tableId: number) {
    const [loading, setLoading] = React.useState(false);
    const dispatch: Dispatch = useDispatch();
    const tableStats = useSelector(
        (state: IStoreState) =>
            state.dataSources.dataTableStatByTableId[tableId]
    );
    React.useEffect(() => {
        setLoading(true);
        dispatch(fetchDataTableStatsIfNeeded(tableId)).finally(() => {
            setLoading(false);
        });
    }, [tableId]);
    return {
        loading,
        tableStats,
    };
}

export const DataTableStats: React.FunctionComponent<IProps> = ({
    tableId,
}) => {
    const { loading, tableStats } = useFetchDataTableStats(tableId);

    if (loading) {
        return (
            <div className="center-align mv4">
                <LoadingIcon />
            </div>
        );
    } else if (!tableStats) {
        return null;
    }

    const statsDOM = (tableStats || []).map((tableStat) => (
        <KeyContentDisplay key={tableStat.id} keyString={tableStat.key}>
            {renderStatValue(tableStat.value)}
        </KeyContentDisplay>
    ));

    return <div className="DataTableStats">{statsDOM}</div>;
};
