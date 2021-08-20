import * as React from 'react';

import { useResource } from 'hooks/useResource';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';
import { TableStats } from './DataTableStatsCommon';
import { TableColumnResource } from 'resource/table';

interface IProps {
    columnId: number;
}

export const DataTableColumnStats: React.FunctionComponent<IProps> = ({
    columnId,
}) => {
    const { data: tableColumnStats } = useResource(
        React.useCallback(() => TableColumnResource.getStats(columnId), [
            columnId,
        ])
    );

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
