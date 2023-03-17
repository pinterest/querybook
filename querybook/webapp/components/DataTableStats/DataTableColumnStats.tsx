import * as React from 'react';

import { ITableColumnStats } from 'const/metastore';
import { isNumeric } from 'lib/utils/number';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';

import { TableStats } from './DataTableStatsCommon';

interface IProps {
    stats: ITableColumnStats[];
}

export const DataTableColumnStats: React.FunctionComponent<IProps> = ({
    stats,
}) => {
    const statsDOM = (stats || []).map((tableColumnStat) => (
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
