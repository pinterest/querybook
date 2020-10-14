import * as React from 'react';
import { TableStatValue } from 'const/metastore';
import { formatNumber } from 'lib/chart/chart-utils';

export const TableStats: React.FC<{ val: TableStatValue }> = ({ val }) => {
    let dom: React.ReactNode = null;
    if (Array.isArray(val)) {
        dom = val.map((item, idx) => <div key={idx}>{item}</div>);
    } else if (typeof val === 'number') {
        dom = formatNumber(val);
    } else {
        dom = val;
    }
    return <>{dom}</>;
};
