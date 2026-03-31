import React from 'react';
import { Icon } from 'ui/Icon/Icon';

import './StaleQueryWarning.scss';

export const StaleQueryWarning: React.FC = () => (
    <span
        className="mr8 flex-row stale-query-indicator"
        aria-label="Query has been edited"
        data-balloon-pos="up"
    >
        <Icon name="AlertTriangle" size={12} color="warning" />
        <span className="ml4">Edited</span>
    </span>
);
