import React from 'react';

import { ComponentType, ElementType } from 'const/analytics';
import { trackClick } from 'lib/analytics';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { IconButton } from 'ui/Button/IconButton';

import './SearchContainer.scss';

export const SearchContainer: React.FC = () => {
    const navigateToSearch = React.useCallback(() => {
        trackClick({
            component: ComponentType.LEFT_SIDEBAR,
            element: ElementType.ADHOC_BUTTON,
        });
        navigateWithinEnv('/search/', { isModal: true });
    }, []);

    return (
        <IconButton
            icon="Search"
            tooltipPos="right"
            tooltip="Search Queries, Docs, Tables, and Boards"
            onClick={navigateToSearch}
            title="Search"
        />
    );
};
