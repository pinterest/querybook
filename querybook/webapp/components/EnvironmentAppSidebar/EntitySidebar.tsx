import React from 'react';
import { Route } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { currentEnvironmentSelector } from 'redux/environment/selector';
import { queryMetastoresSelector } from 'redux/dataSources/selector';
import { Entity } from './types';

import { InfoMenuButton } from 'components/InfoMenuButton/InfoMenuButton';
import { QueryEngineStatusButton } from 'components/QueryEngineStatusButton/QueryEngineStatusButton';
import { QueryExecutionButton } from 'components/QueryExecutionButton/QueryExecutionButton';
import { SearchContainer } from 'components/Search/SearchContainer';
import { UserMenu } from 'components/UserMenu/UserMenu';

import { IconButton } from 'ui/Button/IconButton';
import { Link } from 'ui/Link/Link';

import './EntitySidebar.scss';

interface IEntitySidebarProps {
    selectedEntity: Entity;
    onSelectEntity: (entity: Entity) => any;
}

export const EntitySidebar: React.FunctionComponent<IEntitySidebarProps> = React.memo(
    ({ selectedEntity, onSelectEntity }) => {
        const environment = useSelector(currentEnvironmentSelector);
        const queryMetastores = useSelector(queryMetastoresSelector);

        return (
            <div className="EntitySidebar">
                <div className="apps-list flex-column">
                    <Route
                        render={({ location }) => (
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
                                <SearchContainer />
                                <Link to={`/${environment.name}/adhoc/`}>
                                    <div>
                                        <IconButton
                                            icon="edit"
                                            tooltip={'Adhoc Query'}
                                            tooltipPos="right"
                                            active={location.pathname.startsWith(
                                                `/${environment.name}/adhoc/`
                                            )}
                                            title="Adhoc"
                                        />
                                    </div>
                                </Link>
                                <Link to={`/${environment.name}/doc_schedules`}>
                                    <IconButton
                                        icon="clock"
                                        tooltip="Scheduled Docs"
                                        tooltipPos="right"
                                        title="Scheduled Docs"
                                    />
                                </Link> 
                            </>
                        )}
                    />
                </div>
                <div className="apps-list sidebar-list flex-column">
                    <IconButton
                        icon="file"
                        tooltip="DataDocs"
                        tooltipPos="right"
                        active={selectedEntity === 'datadoc'}
                        onClick={() => {
                            onSelectEntity('datadoc');
                        }}
                        title="Docs"
                    />
                    {queryMetastores.length ? (
                        <IconButton
                            icon="book"
                            tooltip="Tables"
                            tooltipPos="right"
                            active={selectedEntity === 'table'}
                            onClick={() => onSelectEntity('table')}
                            title="Tables"
                        />
                    ) : null}
                    <IconButton
                        icon="code"
                        tooltip="Snippets"
                        tooltipPos="right"
                        active={selectedEntity === 'snippet'}
                        onClick={() => onSelectEntity('snippet')}
                        title="Snips"
                    />
                    <QueryExecutionButton
                        onClick={() => onSelectEntity('execution')}
                        active={selectedEntity === 'execution'}
                    />
                   
                </div>
                <div className="apps-list flex-column">
                    <QueryEngineStatusButton />
                    <UserMenu />
                    <InfoMenuButton />
                </div>
            </div>
        );
    }
);
