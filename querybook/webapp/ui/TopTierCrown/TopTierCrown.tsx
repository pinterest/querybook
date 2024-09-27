import clsx from 'clsx';
import React from 'react';

import { Icon } from 'ui/Icon/Icon';

import './TopTierCrown.scss';

export const TopTierCrown: React.FunctionComponent<{
    className?: string;
    showTooltip?: boolean;
    tooltipPos?: string;
}> = ({ className, showTooltip = false, tooltipPos = 'down' }) => (
    <span
        className={clsx('TopTierCrown', 'flex-row', className)}
        {...(showTooltip
            ? {
                  'data-balloon': 'Top Tier',
                  'data-balloon-pos': tooltipPos,
              }
            : {})}
    >
        <Icon name="Crown" />
    </span>
);
