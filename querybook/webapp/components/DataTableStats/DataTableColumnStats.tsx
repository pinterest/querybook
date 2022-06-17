import * as React from 'react';

import { useResource } from 'hooks/useResource';
import { isNumeric } from 'lib/utils/number';
import { TableColumnResource } from 'resource/table';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';

import { TableStats } from './DataTableStatsCommon';

interface IProps {
    columnId: number;
}

export const DataTableColumnStats: React.FunctionComponent<IProps> = ({
    columnId,
}) => {
    const { data: tableColumnStats } = useResource(
        React.useCallback(
            () => TableColumnResource.getStats(columnId),
            [columnId]
        )
    );

    const statsDOM = (tableColumnStats || []).map((tableColumnStat) => (
        <KeyContentDisplay
            key={tableColumnStat.id}
            keyString={tableColumnStat.key}
            rightAlign={isNumeric(tableColumnStat.value)}
        >
            <TableStats val={tableColumnStat.value} />
        </KeyContentDisplay>
    ));

    return <div className="DataTableColumnStats">{statsDOM}</div>;
};
