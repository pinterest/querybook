import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import history from 'lib/router-history';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { Modal } from 'ui/Modal/Modal';
import { useBrowserTitle } from 'hooks/useBrowserTitle';
import { useModalRoute } from 'hooks/useModalRoute';
import { UserSettingsMenu } from 'components/UserSettingsMenu/UserSettingsMenu';

export const UserSettingsMenuRoute: React.FunctionComponent<RouteComponentProps> = ({
    location,
}) => {
    useBrowserTitle('User Settings');
    const isModalRoute = useModalRoute(location);
    const contentDOM = <UserSettingsMenu />;

    return (
        <Modal
            onHide={
                isModalRoute ? history.goBack : () => navigateWithinEnv('/')
            }
            title="User Settings"
            className="with-padding"
        >
            {contentDOM}
        </Modal>
    );
};
