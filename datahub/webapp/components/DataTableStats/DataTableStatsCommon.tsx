import * as React from 'react';
import { TableStatValue } from 'const/metastore';
import { formatNumber } from 'lib/chart/chart-utils';

export const renderStatValue = (val: TableStatValue) => {
    if (Array.isArray(val)) {
        return val.map((item, idx) => <div key={idx}>{item}</div>);
    } else {
        return formatNumber(val);
    }
};
