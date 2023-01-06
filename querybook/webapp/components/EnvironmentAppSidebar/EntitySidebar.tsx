import React from 'react';
import { useSelector } from 'react-redux';
import { Route } from 'react-router-dom';

import { InfoMenuButton } from 'components/InfoMenuButton/InfoMenuButton';
import { QueryEngineStatusButton } from 'components/QueryEngineStatusButton/QueryEngineStatusButton';
import { QueryExecutionButton } from 'components/QueryExecutionButton/QueryExecutionButton';
import { SearchContainer } from 'components/Search/SearchContainer';
import { UserMenu } from 'components/UserMenu/UserMenu';
import {
    ComponentType,
    ElementType,
    getComponentAnalyticsEvent,
} from 'const/analytics';
import { queryMetastoresSelector } from 'redux/dataSources/selector';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { IconButton } from 'ui/Button/IconButton';
import { Link } from 'ui/Link/Link';

import { Entity } from './types';

import './EntitySidebar.scss';

const getSidebarEvent = getComponentAnalyticsEvent(ComponentType.LEFT_SIDEBAR);

interface IEntitySidebarProps {
    selectedEntity: Entity;
    onSelectEntity: (entity: Entity) => any;
}

export const EntitySidebar: React.FunctionComponent<IEntitySidebarProps> =
    React.memo(({ selectedEntity, onSelectEntity }) => {
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
                                        icon="Home"
                                        tooltip="Home"
                                        tooltipPos="right"
                                        active={
                                            location.pathname ===
                                            `/${environment.name}/`
                                        }
                                        trackEvent={getSidebarEvent(
                                            ElementType.HOME_BUTTON
                                        )}
                                    />
                                </Link>
                                <SearchContainer />
                                <Link to={`/${environment.name}/adhoc/`}>
                                    <IconButton
                                        icon="Edit"
                                        tooltip={'Adhoc Query'}
                                        tooltipPos="right"
                                        active={location.pathname.startsWith(
                                            `/${environment.name}/adhoc/`
                                        )}
                                        title="Adhoc"
                                        trackEvent={getSidebarEvent(
                                            ElementType.ADHOC_BUTTON
                                        )}
                                    />
                                </Link>
                                <Link
                                    to={`/${environment.name}/doc_schedules/`}
                                >
                                    <IconButton
                                        icon="Clock"
                                        tooltip="Scheduled Docs"
                                        tooltipPos="right"
                                        active={location.pathname.startsWith(
                                            `/${environment.name}/doc_schedules/`
                                        )}
                                        title="Scheds"
                                        trackEvent={getSidebarEvent(
                                            ElementType.SCHEDS_BUTTON
                                        )}
                                    />
                                </Link>
                            </>
                        )}
                    />
                </div>
                <div className="apps-list sidebar-list flex-column">
                    <IconButton
                        icon="File"
                        tooltip="DataDocs"
                        tooltipPos="right"
                        active={selectedEntity === 'datadoc'}
                        onClick={() => {
                            onSelectEntity('datadoc');
                        }}
                        trackEvent={getSidebarEvent(ElementType.DOCS_BUTTON)}
                        title="Docs"
                    />
                    {queryMetastores.length ? (
                        <IconButton
                            icon="Book"
                            tooltip="Tables"
                            tooltipPos="right"
                            active={selectedEntity === 'table'}
                            trackEvent={getSidebarEvent(
                                ElementType.TABLES_BUTTON
                            )}
                            onClick={() => {
                                onSelectEntity('table');
                            }}
                            title="Tables"
                        />
                    ) : null}
                    <IconButton
                        icon="Code"
                        tooltip="Snippets"
                        tooltipPos="right"
                        active={selectedEntity === 'snippet'}
                        trackEvent={getSidebarEvent(ElementType.SNIPS_BUTTON)}
                        onClick={() => {
                            onSelectEntity('snippet');
                        }}
                        title="Snips"
                    />
                    <QueryExecutionButton
                        onClick={() => {
                            onSelectEntity('execution');
                        }}
                        trackEvent={getSidebarEvent(ElementType.EXECS_BUTTON)}
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
    });
