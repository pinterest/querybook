import * as React from 'react';

import { useDataFetch } from 'hooks/useDataFetch';

import { renderStatValue } from 'components/DataTableViewOverview/DataTableStats';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';

interface IProps {
    columnId: number;
}

interface ITableColumnStats {
    id: number;
    column_id: number;
    key: string;
    value: JSON;
    uid: number;
}
export const DataTableColumnStats: React.FunctionComponent<IProps> = ({
    columnId,
}) => {
    const {
        data: tableColumnStats,
    }: { data: ITableColumnStats[] } = useDataFetch({
        url: `/column/stats/${columnId}/`,
    });

    const statsDOM = (tableColumnStats || []).map((tableColumnStat) => (
        <KeyContentDisplay
            key={tableColumnStat.id}
            keyString={tableColumnStat.key}
            content={renderStatValue(tableColumnStat.value)}
        />
    ));

    return <div className="DataTableColumnStats">{statsDOM}</div>;
};
