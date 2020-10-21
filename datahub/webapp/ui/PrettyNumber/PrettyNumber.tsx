import React, { useMemo } from 'react';
import { formatNumber } from 'lib/utils/number';

export const PrettyNumber: React.FC<{
    val: number | string;
    unit?: string;
}> = ({ val, unit }) => {
    const formattedNumber = useMemo(() => formatNumber(val, unit), [val, unit]);
    return <>{formattedNumber}</>;
};
