import React from 'react';

import { navigateWithinEnv } from 'lib/utils/query-string';
import { IconButton } from 'ui/Button/IconButton';

import './SearchContainer.scss';

export const SearchContainer: React.FC = () => {
    const navigateToSearch = React.useCallback(() => {
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
