import * as React from 'react';

import { useDataFetch } from 'hooks/useDataFetch';

import { renderStatValue } from 'components/DataTableViewOverview/DataTableStats';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';

interface IProps {
    columnId: number;
}

interface ITableStats {
    id: number;
    column_id: number;
    key: string;
    value: JSON;
    uid: number;
}
export const DataTableColumnStats: React.FunctionComponent<IProps> = ({
    columnId,
}) => {
    const { data: tableStats }: { data: ITableStats[] } = useDataFetch({
        url: `/column/stats/${columnId}/`,
    });

    const statsDOM = (tableStats || []).map((tableStat) => (
        <KeyContentDisplay
            keyString={tableStat.key}
            content={renderStatValue(tableStat.value)}
        />
    ));

    return <div className="DataTableColumnStats">{statsDOM}</div>;
};
