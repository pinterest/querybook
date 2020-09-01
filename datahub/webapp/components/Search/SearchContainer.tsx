import React from 'react';
import { IconButton } from 'ui/Button/IconButton';

import './SearchContainer.scss';
import { navigateWithinEnv } from 'lib/utils/query-string';

export const SearchContainer: React.FunctionComponent<{}> = ({}) => {
    const navigateToSearch = React.useCallback(() => {
        navigateWithinEnv('/search/', { isModal: true });
    }, []);

    return (
        <IconButton
            icon="search"
            tooltipPos="right"
            tooltip="Search in DataHub"
            onClick={navigateToSearch}
        />
    );
};
