import clsx from 'clsx';
import React from 'react';

import { Announcements } from 'components/Announcements/Announcements';
import { CommandKModal } from 'components/Search/CommandKModal';
import { SessionExpirationNotice } from 'components/SessionExpirationNotice/SessionExpirationNotice';
import { useGlobalState } from 'hooks/redux/useGlobalState';
import { FullHeight } from 'ui/FullHeight/FullHeight';

import './AppLayout.scss';

export const AppLayout: React.FunctionComponent = (props) => {
    const [appBlurred] = useGlobalState('appBlurred', false);
    const appLayoutClassName = clsx({
        AppLayout: true,
        'AppLayout-blurred': appBlurred,
    });

    return (
        <FullHeight flex="column" className={appLayoutClassName}>
            <FullHeight className="app-content-wrapper" flex="column">
                <SessionExpirationNotice />
                <Announcements />
                {props.children}
            </FullHeight>
            <CommandKModal />
        </FullHeight>
    );
};
