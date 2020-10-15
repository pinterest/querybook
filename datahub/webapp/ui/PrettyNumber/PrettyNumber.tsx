import React, { useMemo } from 'react';
import { formatNumber } from 'lib/chart/chart-utils';

export const PrettyNumber: React.FC<{
    val: number | string;
}> = ({ val }) => {
    const formattedNumber = useMemo(() => formatNumber(val), [val]);
    return <>{formattedNumber}</>;
};
