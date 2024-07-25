import React from 'react';

import './TopTierCrown.scss';
import { Icon } from 'ui/Icon/Icon';

export const TopTierCrown: React.FunctionComponent<{
    showTooltip?: boolean;
    tooltipPos?: string;
}> = ({ showTooltip = false, tooltipPos = 'down' }) => {
    if (showTooltip) {
        return (
            <span
                className="TopTierCrown flex-row"
                aria-label="Top Tier"
                data-balloon-pos={tooltipPos}
            >
                <Icon className="ml4" name="Crown" />
            </span>
        );
    } else {
        return <Icon className="TopTierCrown ml4" name="Crown" />;
    }
};
