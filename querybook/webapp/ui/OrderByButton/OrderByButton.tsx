import clsx from 'clsx';
import { capitalize } from 'lodash';
import React, { useMemo } from 'react';

import NOOP from 'lib/utils/noop';
import { TextToggleButton } from 'ui/Button/TextToggleButton';

import './OrderByButton.scss';

export interface ISortButtonProps {
    asc: boolean;
    /**
     * Full field name of the field
     * that will be ordered, shown
     * in tooltips
     */
    orderByField: string;

    /**
     * Short symbol to display in UI
     * as button
     */
    orderByFieldSymbol?: string;
    className?: string;

    onOrderByFieldToggle?: () => void;
    onAscToggle?: () => void;
}

export const OrderByButton: React.FC<ISortButtonProps> = ({
    asc,
    orderByField,
    orderByFieldSymbol,
    className,

    onOrderByFieldToggle = NOOP,
    onAscToggle = NOOP,
}) => {
    const buttonSymbol = useMemo(
        () => orderByFieldSymbol ?? capitalize(orderByField.slice(0, 2)),
        [orderByField, orderByFieldSymbol]
    );

    return (
        <span className={clsx('OrderByButton', className)}>
            <TextToggleButton
                value={false}
                onChange={onAscToggle}
                tooltip={asc ? 'Ascending' : 'Descending'}
                tooltipPos="left"
                text={asc ? '↑' : '↓'}
            />
            <TextToggleButton
                value={false}
                onChange={onOrderByFieldToggle}
                tooltip={`Order by ${orderByField}`}
                tooltipPos="left"
                text={buttonSymbol}
            />
        </span>
    );
};
