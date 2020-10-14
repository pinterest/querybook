import * as React from 'react';
import { TableStatValue } from 'const/metastore';
import { formatNumber } from 'lib/chart/chart-utils';

export const renderStatValue = (val: TableStatValue) => {
    if (Array.isArray(val)) {
        return val.map((item, idx) => <div key={idx}>{item}</div>);
    } else if (typeof val === 'number') {
        return formatNumber(val);
    }

    return val;
};
