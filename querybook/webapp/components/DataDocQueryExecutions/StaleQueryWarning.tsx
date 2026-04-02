import React from 'react';

import type { StaleWarningState } from 'hooks/queryEditor/useStaleQueryWarning';
import { Icon } from 'ui/Icon/Icon';

import './StaleQueryWarning.scss';

interface IProps {
    variant: NonNullable<StaleWarningState>;
}

const TOOLTIP: Record<NonNullable<StaleWarningState>, string> = {
    edited: 'Changes are saved but not executed',
    unsaved: 'Changes are unsaved and not executed',
};

export const StaleQueryWarning: React.FC<IProps> = ({ variant }) => (
    <span
        className="mr8 flex-row stale-query-indicator"
        aria-label={TOOLTIP[variant]}
        data-balloon-pos="up"
    >
        <Icon name="AlertTriangle" size={12} color="warning" />
        <span className="ml4">Edited</span>
    </span>
);
