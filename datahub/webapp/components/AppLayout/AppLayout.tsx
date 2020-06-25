import React from 'react';
import classNames from 'classnames';

import { Announcements } from 'components/Announcements/Announcements';
import { ErrorBoundary } from 'ui/ErrorBoundary/ErrorBoundary';
import { FullHeight } from 'ui/FullHeight/FullHeight';
import { CommandKModal } from 'components/Search/CommandKModal';
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
                <Announcements />
                <ErrorBoundary>{props.children}</ErrorBoundary>
            </FullHeight>
            <CommandKModal />
        </FullHeight>
    );
};
