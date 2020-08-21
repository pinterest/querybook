import * as React from 'react';

import { useDataFetch } from 'hooks/useDataFetch';

import { TableStatValueType, renderStatValue } from './DataTableStatsCommon';

import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';

interface IProps {
    columnId: number;
}

interface ITableColumnStats {
    id: number;
    column_id: number;
    key: string;
    value: TableStatValueType;
    uid: number;
}
export const DataTableColumnStats: React.FunctionComponent<IProps> = ({
    columnId,
}) => {
    const { data: tableColumnStats } = useDataFetch<ITableColumnStats[]>({
        url: `/column/stats/${columnId}/`,
    });

    const statsDOM = (tableColumnStats || []).map((tableColumnStat) => (
        <KeyContentDisplay
            key={tableColumnStat.id}
            keyString={tableColumnStat.key}
        >
            {renderStatValue(tableColumnStat.value)}
        </KeyContentDisplay>
    ));

    return <div className="DataTableColumnStats">{statsDOM}</div>;
};
