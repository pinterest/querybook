import React from 'react';
import { Route, RouteComponentProps } from 'react-router-dom';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { matchKeyPress } from 'lib/utils/keyboard';
import { useWindowEvent } from 'hooks/useWindowEvent';

export const CommandKModal: React.FunctionComponent = () => (
    <Route component={CommandKModalInner} />
);

const CommandKModalInner: React.FunctionComponent<RouteComponentProps> = ({
    history,
}) => {
    const onKeyDown = React.useCallback((evt) => {
        const isAtSearchPage = history.location.pathname.endsWith('/search/');
        if (!isAtSearchPage) {
            if (matchKeyPress(evt, 'Cmd-K')) {
                navigateWithinEnv('/search/', { isModal: true });
                evt.stopPropagation();
                evt.preventDefault();
            }
        }
    }, []);
    useWindowEvent('keydown', onKeyDown);

    return null;
};
