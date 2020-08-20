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
    const parsedVal = JSON.parse(val);

    if (Array.isArray(parsedVal)) {
        return parsedVal.map((item) => <div>{item}</div>);
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
            keyString={tableStat.key}
            content={renderStatValue(tableStat.value)}
        />
    ));

    return <div className="DataTableStats">{statsDOM}</div>;
};
