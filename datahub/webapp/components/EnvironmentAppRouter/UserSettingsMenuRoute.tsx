import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import history from 'lib/router-history';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { Modal } from 'ui/Modal/Modal';
import { useModalRoute } from 'hooks/useModalRoute';
import { UserSettingsMenu } from 'components/UserSettingsMenu/UserSettingsMenu';

export const UserSettingsMenuRoute: React.FunctionComponent<RouteComponentProps> = ({
    location,
}) => {
    const isModalRoute = useModalRoute(location);
    const contentDOM = <UserSettingsMenu />;

    return (
        <Modal
            onHide={
                isModalRoute ? history.goBack : () => navigateWithinEnv('/')
            }
            title="DataHub User Settings"
            className="with-padding"
        >
            {contentDOM}
        </Modal>
    );
};
