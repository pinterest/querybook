import * as React from 'react';

import { TableStatValue } from 'const/metastore';
import { useDataFetch } from 'hooks/useDataFetch';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';
import { TableStats } from './DataTableStatsCommon';

interface IProps {
    columnId: number;
}

interface ITableColumnStats {
    id: number;
    column_id: number;
    key: string;
    value: TableStatValue;
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
            <TableStats val={tableColumnStat.value} />
        </KeyContentDisplay>
    ));

    return <div className="DataTableColumnStats">{statsDOM}</div>;
};
