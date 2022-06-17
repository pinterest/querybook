import React from 'react';
import { Route, RouteComponentProps } from 'react-router-dom';

import KeyMap from 'const/keyMap';
import { useEvent } from 'hooks/useEvent';
import { matchKeyPress } from 'lib/utils/keyboard';
import { navigateWithinEnv } from 'lib/utils/query-string';

export const CommandKModal: React.FunctionComponent = () => (
    <Route component={CommandKModalInner} />
);

const CommandKModalInner: React.FunctionComponent<RouteComponentProps> = ({
    history,
}) => {
    const onKeyDown = React.useCallback((evt) => {
        const isAtSearchPage = history.location.pathname.endsWith('/search/');
        if (!isAtSearchPage) {
            if (matchKeyPress(evt, KeyMap.overallUI.openSearch.key)) {
                navigateWithinEnv('/search/', { isModal: true });
                evt.stopPropagation();
                evt.preventDefault();
            }
        }
    }, []);
    useEvent('keydown', onKeyDown);

    return null;
};
