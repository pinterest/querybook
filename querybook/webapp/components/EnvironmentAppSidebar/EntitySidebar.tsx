import React from 'react';
import { useSelector } from 'react-redux';
import { Route } from 'react-router-dom';

import { InfoMenuButton } from 'components/InfoMenuButton/InfoMenuButton';
import { QueryEngineStatusButton } from 'components/QueryEngineStatusButton/QueryEngineStatusButton';
import { QueryExecutionButton } from 'components/QueryExecutionButton/QueryExecutionButton';
import { SearchContainer } from 'components/Search/SearchContainer';
import { UserMenu } from 'components/UserMenu/UserMenu';
import { ComponentType, ElementType } from 'const/analytics';
import { trackClick } from 'lib/analytics';
import { queryMetastoresSelector } from 'redux/dataSources/selector';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { IconButton } from 'ui/Button/IconButton';
import { Link } from 'ui/Link/Link';

import { Entity } from './types';

import './EntitySidebar.scss';

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
                                        onClick={() =>
                                            trackClick({
                                                component:
                                                    ComponentType.LEFT_SIDEBAR,
                                                element:
                                                    ElementType.HOME_BUTTON,
                                            })
                                        }
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
                                        onClick={() =>
                                            trackClick({
                                                component:
                                                    ComponentType.LEFT_SIDEBAR,
                                                element:
                                                    ElementType.ADHOC_BUTTON,
                                            })
                                        }
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
                                        onClick={() =>
                                            trackClick({
                                                component:
                                                    ComponentType.LEFT_SIDEBAR,
                                                element:
                                                    ElementType.SCHEDS_BUTTON,
                                            })
                                        }
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
                            trackClick({
                                component: ComponentType.LEFT_SIDEBAR,
                                element: ElementType.DOCS_BUTTON,
                            });
                            onSelectEntity('datadoc');
                        }}
                        title="Docs"
                    />
                    {queryMetastores.length ? (
                        <IconButton
                            icon="Book"
                            tooltip="Tables"
                            tooltipPos="right"
                            active={selectedEntity === 'table'}
                            onClick={() => {
                                trackClick({
                                    component: ComponentType.LEFT_SIDEBAR,
                                    element: ElementType.TABLES_BUTTON,
                                });
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
                        onClick={() => {
                            trackClick({
                                component: ComponentType.LEFT_SIDEBAR,
                                element: ElementType.SNIPS_BUTTON,
                            });
                            onSelectEntity('snippet');
                        }}
                        title="Snips"
                    />
                    <QueryExecutionButton
                        onClick={() => {
                            trackClick({
                                component: ComponentType.LEFT_SIDEBAR,
                                element: ElementType.EXECS_BUTTON,
                            });
                            onSelectEntity('execution');
                        }}
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
