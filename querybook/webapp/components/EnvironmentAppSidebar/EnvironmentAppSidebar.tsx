import React from 'react';
import clsx from 'clsx';

import { navigateWithinEnv } from 'lib/utils/query-string';
import { useEvent } from 'hooks/useEvent';
import { matchKeyMap, KeyMap } from 'lib/utils/keyboard';
import { getAbbrEnvName } from 'lib/utils';
import { useSelector } from 'react-redux';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { Entity } from './types';

import { QuerySnippetNavigator } from 'components/QuerySnippetNavigator/QuerySnippetNavigator';
import { DataDocSchemaNavigator } from 'components/DataDocSchemaNavigator/DataDocSchemaNavigator';
import { QueryViewNavigator } from 'components/QueryViewNavigator/QueryViewNavigator';
import { DataDocNavigator } from 'components/DataDocNavigator/DataDocNavigator';
import { EnvironmentTopbar } from './EnvironmentTopbar';
import { EntitySidebar } from './EntitySidebar';
import { EnvironmentDropdownButton } from './EnvironmentDropdownButton';

import { Sidebar } from 'ui/Sidebar/Sidebar';
import { Icon } from 'ui/Icon/Icon';

import './EnvironmentAppSidebar.scss';

const SIDEBAR_WIDTH = 320;

export const EnvironmentAppSidebar: React.FunctionComponent = () => {
    const [collapsed, setCollapsed] = React.useState(false);
    const [entity, setEntity] = React.useState<Entity>('datadoc');

    const currentEnvironment = useSelector(currentEnvironmentSelector);

    const handleEntitySelect = React.useCallback((e: Entity) => {
        setCollapsed(false);
        setEntity(e);
    }, []);

    const scrollToCollapseSidebar = React.useCallback(
        (event, direction, elementRef) => {
            if (
                direction === 'right' &&
                elementRef.clientWidth === SIDEBAR_WIDTH
            ) {
                const sidebarRect = elementRef.getBoundingClientRect();
                // this checks if mouse cursor is SIDEBAR_WIDTH / 2 left of sidebar
                if (
                    event instanceof MouseEvent &&
                    sidebarRect.left + sidebarRect.width - event.clientX >
                        SIDEBAR_WIDTH / 2
                ) {
                    setCollapsed(true);
                }
            }
        },
        []
    );

    const handleCollapseKeyDown = React.useCallback(
        (evt) => {
            if (matchKeyMap(evt, KeyMap.overallUI.toggleSidebar)) {
                setCollapsed(!collapsed);
                evt.stopPropagation();
                evt.preventDefault();
            }
        },
        [collapsed]
    );

    useEvent('keydown', handleCollapseKeyDown);

    let navigator: React.ReactNode;
    if (!collapsed) {
        navigator =
            entity === 'datadoc' ? (
                <DataDocNavigator />
            ) : entity === 'table' ? (
                <DataDocSchemaNavigator />
            ) : entity === 'snippet' ? (
                <QuerySnippetNavigator
                    onQuerySnippetSelect={(querySnippet) =>
                        navigateWithinEnv(
                            `/query_snippet/${querySnippet.id}/`,
                            {
                                isModal: true,
                            }
                        )
                    }
                />
            ) : entity === 'execution' ? (
                <QueryViewNavigator
                    onQueryExecutionClick={(queryExecution) =>
                        navigateWithinEnv(
                            `/query_execution/${queryExecution.id}/`,
                            {
                                isModal: true,
                            }
                        )
                    }
                />
            ) : (
                <div />
            );
    }

    const collapseButton = (
        <span
            onClick={() => setCollapsed(!collapsed)}
            className="collapse-sidebar-button"
        >
            <Icon name={collapsed ? 'chevron-right' : 'chevron-left'} />
        </span>
    );

    const environmentPickerSection = collapsed ? (
        <div className="collapsed-env">
            <EnvironmentDropdownButton
                customButtonRenderer={() => (
                    <div className="env-icon selected">
                        <span className="env-icon-text">
                            {getAbbrEnvName(currentEnvironment?.name)}
                        </span>
                    </div>
                )}
            />
        </div>
    ) : (
        <EnvironmentTopbar />
    );

    const contentDOM = (
        <>
            <div className="EnvironmentAppSidebar-content">
                <div className="sidebar-environment-picker">
                    {environmentPickerSection}
                </div>
                <div className="sidebar-content-main">
                    <EntitySidebar
                        selectedEntity={entity}
                        onSelectEntity={handleEntitySelect}
                    />
                    <div className="sidebar-content-main-navigator">
                        {navigator}
                    </div>
                </div>
                {collapseButton}
            </div>
        </>
    );

    const className = clsx({
        EnvironmentAppSidebar: true,
        collapsed,
    });

    return collapsed ? (
        <div className={className}>{contentDOM}</div>
    ) : (
        <Sidebar
            className={className}
            initialWidth={SIDEBAR_WIDTH}
            minWidth={SIDEBAR_WIDTH}
            onResize={scrollToCollapseSidebar}
        >
            {contentDOM}
        </Sidebar>
    );
};
