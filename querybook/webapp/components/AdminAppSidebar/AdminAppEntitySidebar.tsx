import React from 'react';

import { AdminEntity, adminEntityToTitle } from 'components/AppAdmin/types';
import history from 'lib/router-history';
import { getAppName } from 'lib/utils/global';
import { IconButton } from 'ui/Button/IconButton';
import { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { QuerybookLogo } from 'ui/QuerybookLogo/QuerybookLogo';

import './AdminAppEntitySidebar.scss';

interface IAdminAppEntitySidebarProps {
    selectedEntity: AdminEntity;
    onSelectEntity: (entity: AdminEntity) => any;
}

export const AdminAppEntitySidebar: React.FunctionComponent<
    IAdminAppEntitySidebarProps
> = ({ selectedEntity, onSelectEntity }) => {
    const makeSidebarItem = (key: AdminEntity, icon: AllLucideIconNames) => (
        <div
            className={`AdminAppEntitySidebar-item flex-row ${
                selectedEntity === key ? 'active' : ''
            }`}
            onClick={() => onSelectEntity(key)}
        >
            <IconButton icon={icon} active={selectedEntity === key} />
            <span className={`AdminAppEntitySidebar-title`}>
                {adminEntityToTitle[key]}
            </span>
        </div>
    );

    return (
        <div className="AdminAppEntitySidebar">
            <div className="AdminAppEntitySidebar-main">
                <div
                    className="AdminAppEntitySidebar-top mv16"
                    onClick={() => history.push('/admin/')}
                >
                    <QuerybookLogo size={1.3} withBrandMark />
                    <div>ADMIN APP</div>
                </div>
                <div className="mb16">
                    {makeSidebarItem('environment', 'Box')}
                    {makeSidebarItem('metastore', 'Database')}
                    {makeSidebarItem('query_engine', 'Server')}
                </div>

                <div className="mb16">
                    {makeSidebarItem('task', 'Clipboard')}
                    {makeSidebarItem('task_status', 'Activity')}
                </div>
                <div className="mb16">
                    {makeSidebarItem('user_role', 'Users')}
                    {makeSidebarItem('api_access_token', 'Key')}
                    {makeSidebarItem('announcement', 'Volume2')}
                </div>
                {makeSidebarItem('config', 'Settings')}
            </div>
            <div className="AdminAppEntitySidebar-bottom mb8">
                <div
                    className="AdminAppEntitySidebar-item flex-row"
                    onClick={() => history.push('/')}
                >
                    <IconButton
                        icon="LogOut"
                        tooltipPos="right"
                        active={false}
                    />
                    <span className="AdminAppEntitySidebar-title">
                        Back to {getAppName()}
                    </span>
                </div>
            </div>
        </div>
    );
};
