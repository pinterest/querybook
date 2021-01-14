import * as React from 'react';
import { TableStatValue } from 'const/metastore';
import { PrettyNumber } from 'ui/PrettyNumber/PrettyNumber';

export const TableStats: React.FC<{ val: TableStatValue }> = ({ val }) => {
    let dom: React.ReactNode = null;
    if (Array.isArray(val)) {
        dom = val.map((item, idx) => <div key={idx}>{item}</div>);
    } else if (typeof val === 'number') {
        dom = <PrettyNumber val={val} />;
    } else {
        dom = val;
    }
    return <>{dom}</>;
};
