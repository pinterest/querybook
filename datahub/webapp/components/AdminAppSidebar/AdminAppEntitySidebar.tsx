import React from 'react';

import history from 'lib/router-history';

import { AdminEntity, adminEntityToTitle } from 'components/AppAdmin/types';

import { Divider } from 'ui/Divider/Divider';
import { IconButton } from 'ui/Button/IconButton';

import './AdminAppEntitySidebar.scss';

interface IAdminAppEntitySidebarProps {
    selectedEntity: AdminEntity;
    onSelectEntity: (entity: AdminEntity) => any;
}

export const AdminAppEntitySidebar: React.FunctionComponent<IAdminAppEntitySidebarProps> = ({
    selectedEntity,
    onSelectEntity,
}) => {
    const makeSidebarItem = (key: AdminEntity, icon: string) => {
        return (
            <div
                className="AdminAppEntitySidebar-item flex-row"
                onClick={() => onSelectEntity(key)}
            >
                <IconButton icon={icon} active={selectedEntity === key} />
                <span className="AdminAppEntitySidebar-title">
                    {adminEntityToTitle[key]}
                </span>
            </div>
        );
    };
    const divider = (
        <Divider
            marginTop="8px"
            marginBottom="8px"
            height="1px"
            color="transparent"
        />
    );

    return (
        <div className="AdminAppEntitySidebar">
            <div className="AdminAppEntitySidebar-main">
                <div
                    className="AdminAppEntitySidebar-top flex-row"
                    onClick={() => history.push('/admin/')}
                >
                    <span>DH Admin App</span>
                </div>
                {makeSidebarItem('environment', 'box')}
                {makeSidebarItem('metastore', 'database')}
                {makeSidebarItem('query_engine', 'server')}
                {divider}
                {makeSidebarItem('task', 'activity')}
                {divider}
                {makeSidebarItem('user_role', 'users')}
                {makeSidebarItem('api_access_token', 'key')}

                {makeSidebarItem('announcement', 'clipboard')}
                {divider}
                {makeSidebarItem('config', 'settings')}
            </div>
            <div className="AdminAppEntitySidebar-bottom">
                <div
                    className="AdminAppEntitySidebar-item flex-row"
                    onClick={() => history.push('/')}
                >
                    <IconButton
                        icon="log-out"
                        tooltip="Back to DataHub"
                        tooltipPos="right"
                        active={false}
                    />
                    <span className="AdminAppEntitySidebar-title">
                        Back to DataHub
                    </span>
                </div>
            </div>
        </div>
    );
};
