import React from 'react';
import classNames from 'classnames';

import { Announcements } from 'components/Announcements/Announcements';
import { SessionExpirationNotice } from 'components/SessionExpirationNotice/SessionExpirationNotice';
import { CommandKModal } from 'components/Search/CommandKModal';
import { ErrorBoundary } from 'ui/ErrorBoundary/ErrorBoundary';
import { FullHeight } from 'ui/FullHeight/FullHeight';
import { useGlobalState } from 'hooks/redux/useGlobalState';

import './AppLayout.scss';

export const AppLayout: React.FunctionComponent = (props) => {
    const [appBlurred] = useGlobalState('appBlurred', false);
    const appLayoutClassName = classNames({
        AppLayout: true,
        'AppLayout-blurred': appBlurred,
    });

    return (
        <FullHeight flex="column" className={appLayoutClassName}>
            <FullHeight className="app-content-wrapper" flex="column">
                <SessionExpirationNotice />
                <Announcements />
                <ErrorBoundary>{props.children}</ErrorBoundary>
            </FullHeight>
            <CommandKModal />
        </FullHeight>
    );
};
