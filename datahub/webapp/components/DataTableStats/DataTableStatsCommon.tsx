import * as React from 'react';

export type TableStatValueType = number | string | Array<number | string>;

export const renderStatValue = (val: TableStatValueType) => {
    if (Array.isArray(val)) {
        return val.map((item, idx) => <div key={idx}>{item}</div>);
    }

    return val;
};
