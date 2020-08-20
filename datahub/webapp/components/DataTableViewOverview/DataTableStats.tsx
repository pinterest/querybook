import * as React from 'react';

import { useDataFetch } from 'hooks/useDataFetch';

import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';

interface IProps {
    tableId: number;
}

interface ITableStats {
    id: number;
    table_id: number;
    key: string;
    value: JSON;
    uid: number;
}

export const renderStatValue = (val) => {
    if (Array.isArray(val)) {
        return val.map((item, idx) => <div key={idx}>{item}</div>);
    }

    return val;
};

export const DataTableStats: React.FunctionComponent<IProps> = ({
    tableId,
}) => {
    const { data: tableStats }: { data: ITableStats[] } = useDataFetch({
        url: `/table/stats/${tableId}/`,
    });

    const statsDOM = (tableStats || []).map((tableStat) => (
        <KeyContentDisplay
            key={tableStat.id}
            keyString={tableStat.key}
            content={renderStatValue(tableStat.value)}
        />
    ));

    return <div className="DataTableStats">{statsDOM}</div>;
};
