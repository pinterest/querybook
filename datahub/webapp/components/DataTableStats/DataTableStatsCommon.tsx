import * as React from 'react';
import { TableStatValue } from 'const/metastore';

export const renderStatValue = (val: TableStatValue) => {
    if (Array.isArray(val)) {
        return val.map((item, idx) => <div key={idx}>{item}</div>);
    }

    return val;
};
