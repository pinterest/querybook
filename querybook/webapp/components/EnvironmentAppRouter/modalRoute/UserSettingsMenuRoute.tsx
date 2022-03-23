import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import history from 'lib/router-history';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { Modal } from 'ui/Modal/Modal';
import { useBrowserTitle } from 'hooks/useBrowserTitle';
import { useModalRoute } from 'hooks/useModalRoute';
import { Tabs } from 'ui/Tabs/Tabs';
import { UserSettingsMenu } from 'components/UserSettingsMenu/UserSettingsMenu';

export type UserSettingsTab = 'general' | 'editor';

const UserSettingsMenuRoute: React.FunctionComponent<RouteComponentProps> = ({
    location,
}) => {
    useBrowserTitle('User Settings');
    const isModalRoute = useModalRoute(location);

    const [tab, setTab] = React.useState<UserSettingsTab>('general');

    return (
        <Modal
            onHide={
                isModalRoute ? history.goBack : () => navigateWithinEnv('/')
            }
            title="User Settings"
            topDOM={
                <Tabs
                    className="mb8"
                    items={[
                        { key: 'general', name: 'General' },
                        { key: 'editor', name: 'Editor' },
                    ]}
                    selectedTabKey={tab}
                    onSelect={(newTab: UserSettingsTab) => setTab(newTab)}
                />
            }
        >
            <UserSettingsMenu tab={tab} />
        </Modal>
    );
};

export default UserSettingsMenuRoute;
