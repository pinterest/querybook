import React from 'react';
import { Route } from 'react-router-dom';
import { useSelector } from 'react-redux';

import history from 'lib/router-history';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { queryMetastoresSelector } from 'redux/dataSources/selector';
import { IStoreState } from 'redux/store/types';

import { QueryExecutionButton } from 'components/QueryExecutionButton/QueryExecutionButton';
import { UserMenu } from 'components/UserMenu/UserMenu';
import { SearchContainer } from 'components/Search/SearchContainer';
import { QueryEngineStatusButton } from 'components/QueryEngineStatusButton/QueryEngineStatusButton';
import { ChangeLogButton } from 'components/ChangeLogButton/ChangeLogButton';
import { IconButton } from 'ui/Button/IconButton';
import { Entity } from './types';
import './EntitySidebar.scss';

import { Divider } from 'ui/Divider/Divider';
import { Link } from 'ui/Link/Link';
import { HelpMenuButton } from 'components/HelpMenuButton/HelpMenuButton';

interface IEntitySidebarProps {
    selectedEntity: Entity;
    onSelectEntity: (entity: Entity) => any;
}

export const EntitySidebar: React.FunctionComponent<IEntitySidebarProps> = ({
    selectedEntity,
    onSelectEntity,
}) => {
    const isAdmin = useSelector(
        (state: IStoreState) => state.user.myUserInfo.isAdmin
    );
    const environment = useSelector(currentEnvironmentSelector);
    const queryMetastores = useSelector(queryMetastoresSelector);

    const adminAppButton = isAdmin && (
        <IconButton
            icon="settings"
            tooltip={'Admin'}
            tooltipPos="right"
            onClick={() => history.push('/admin/')}
        />
    );

    return (
        <div className="EntitySidebar">
            <div className="apps-list">
                <Route
                    render={({ location }) => {
                        return (
                            <>
                                <Link to={`/${environment.name}/`}>
                                    <IconButton
                                        icon="home"
                                        tooltip="Home"
                                        tooltipPos="right"
                                        active={
                                            location.pathname ===
                                            `/${environment.name}/`
                                        }
                                    />
                                </Link>

                                <Link to={`/${environment.name}/adhoc/`}>
                                    <IconButton
                                        icon="edit"
                                        tooltip={'Adhoc Query'}
                                        tooltipPos="right"
                                        active={location.pathname.startsWith(
                                            `/${environment.name}/adhoc/`
                                        )}
                                    />
                                </Link>
                            </>
                        );
                    }}
                />
                <Divider
                    marginTop="8px"
                    marginBottom="8px"
                    height="1px"
                    color="transparent"
                />
                <IconButton
                    icon="briefcase"
                    tooltip="Lists"
                    tooltipPos="right"
                    active={selectedEntity === 'board'}
                    onClick={() => onSelectEntity('board')}
                />
                <IconButton
                    icon="file"
                    tooltip="DataDocs"
                    tooltipPos="right"
                    active={selectedEntity === 'datadoc'}
                    onClick={() => {
                        onSelectEntity('datadoc');
                    }}
                />
                {queryMetastores.length ? (
                    <IconButton
                        icon="book"
                        tooltip="Tables"
                        tooltipPos="right"
                        active={selectedEntity === 'table'}
                        onClick={() => onSelectEntity('table')}
                    />
                ) : null}
                <IconButton
                    icon="code"
                    tooltip="Snippets"
                    tooltipPos="right"
                    active={selectedEntity === 'snippet'}
                    onClick={() => onSelectEntity('snippet')}
                />
                <QueryExecutionButton
                    onClick={() => onSelectEntity('execution')}
                    active={selectedEntity === 'execution'}
                />
                <Divider
                    marginTop="8px"
                    marginBottom="8px"
                    height="1px"
                    color="transparent"
                />
            </div>
            <div className="sidebar-footer flex-column">
                <SearchContainer />
                <UserMenu />
                <QueryEngineStatusButton />
                <ChangeLogButton />
                <HelpMenuButton />
                {adminAppButton}
            </div>
        </div>
    );
};
