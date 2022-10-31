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
    hideAscToggle?: boolean;

    onOrderByFieldToggle?: () => void;
    onAscToggle?: () => void;
}

export const OrderByButton: React.FC<ISortButtonProps> = ({
    asc,
    orderByField,
    orderByFieldSymbol,
    className,
    hideAscToggle,

    onOrderByFieldToggle = NOOP,
    onAscToggle = NOOP,
}) => {
    const buttonSymbol = useMemo(
        () => orderByFieldSymbol ?? capitalize(orderByField.slice(0, 2)),
        [orderByField, orderByFieldSymbol]
    );

    console.log(`Hide Asc Toggle: ${hideAscToggle}`);

    return (
        <span className={clsx('OrderByButton', className)}>
            {!hideAscToggle && (
                <TextToggleButton
                    value={false}
                    onChange={onAscToggle}
                    tooltip={asc ? 'Ascending' : 'Descending'}
                    tooltipPos="left"
                    text={asc ? '↑' : '↓'}
                />
            )}
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
