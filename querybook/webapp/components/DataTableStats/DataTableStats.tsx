import * as React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { isNumeric } from 'lib/utils/number';
import { IStoreState, Dispatch } from 'redux/store/types';
import { fetchDataTableStatsIfNeeded } from 'redux/dataSources/action';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';
import { LoadingIcon } from 'ui/Loading/Loading';

import { TableStats } from './DataTableStatsCommon';
import './DataTableStats.scss';

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
        <KeyContentDisplay
            key={tableStat.id}
            keyString={tableStat.key}
            rightAlign={isNumeric(tableStat.value)}
        >
            <TableStats val={tableStat.value} />
        </KeyContentDisplay>
    ));

    return <div className="DataTableStats">{statsDOM}</div>;
};
