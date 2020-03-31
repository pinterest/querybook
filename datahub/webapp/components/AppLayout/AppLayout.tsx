import React from 'react';
import classNames from 'classnames';

import { Announcements } from 'components/Announcements/Announcements';
import { ErrorBoundary } from 'ui/ErrorBoundary/ErrorBoundary';
import { FullHeight } from 'ui/FullHeight/FullHeight';
import { CommandKModal } from 'components/Search/CommandKModal';
import { useSelector } from 'react-redux';
import { IStoreState } from 'redux/store/types';

import './AppLayout.scss';

export const AppLayout: React.FunctionComponent = (props) => {
    const appBlurred = useSelector(
        (state: IStoreState) => state.dataHubUI.appBlurred
    );
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
