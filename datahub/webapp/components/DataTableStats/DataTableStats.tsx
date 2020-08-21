import * as React from 'react';

import { useDataFetch } from 'hooks/useDataFetch';

import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';
import { TableStatValueType, renderStatValue } from './DataTableStatsCommon';

interface IProps {
    tableId: number;
}

interface ITableStats {
    id: number;
    table_id: number;
    key: string;
    value: TableStatValueType;
    uid: number;
}

export const DataTableStats: React.FunctionComponent<IProps> = ({
    tableId,
}) => {
    const { data: tableStats } = useDataFetch<ITableStats[]>({
        url: `/table/stats/${tableId}/`,
    });

    const statsDOM = (tableStats || []).map((tableStat) => (
        <KeyContentDisplay key={tableStat.id} keyString={tableStat.key}>
            {renderStatValue(tableStat.value)}
        </KeyContentDisplay>
    ));

    return <div className="DataTableStats">{statsDOM}</div>;
};
