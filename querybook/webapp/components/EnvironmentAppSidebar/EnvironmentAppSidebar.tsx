import clsx from 'clsx';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { DataDocNavigator } from 'components/DataDocNavigator/DataDocNavigator';
import { DataDocSchemaNavigator } from 'components/DataDocSchemaNavigator/DataDocSchemaNavigator';
import { QuerySnippetNavigator } from 'components/QuerySnippetNavigator/QuerySnippetNavigator';
import { QueryViewNavigator } from 'components/QueryViewNavigator/QueryViewNavigator';
import { useEvent } from 'hooks/useEvent';
import { useLocalStoreState } from 'hooks/useLocalStoreState';
import { SIDEBAR_ENTITY } from 'lib/local-store/const';
import { KeyMap, matchKeyMap } from 'lib/utils/keyboard';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { setCollapsed } from 'redux/querybookUI/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Icon } from 'ui/Icon/Icon';
import { Sidebar } from 'ui/Sidebar/Sidebar';

import { EntitySidebar } from './EntitySidebar';
import { EnvironmentDropdownButton } from './EnvironmentDropdownButton';
import { EnvironmentIcon } from './EnvironmentIcon';
import { EnvironmentTopbar } from './EnvironmentTopbar';
import { Entity } from './types';

import './EnvironmentAppSidebar.scss';

const SIDEBAR_WIDTH = 320;

export const EnvironmentAppSidebar: React.FunctionComponent = () => {
    const collapsed: boolean = useSelector(
        (state: IStoreState) => state.querybookUI.isEnvCollapsed
    );
    const dispatch: Dispatch = useDispatch();
    const [entity, setEntity] = useLocalStoreState<Entity>({
        storeKey: SIDEBAR_ENTITY,
        defaultValue: 'datadoc',
    });

    const currentEnvironment = useSelector(currentEnvironmentSelector);

    const handleEntitySelect = React.useCallback(
        (newEntity: Entity | null) => {
            setEntity((oldEntity) => {
                if (collapsed) {
                    dispatch(setCollapsed(false));
                } else if (newEntity === oldEntity) {
                    // Collapse sidebar if the entity is the same
                    dispatch(setCollapsed(true));
                }

                return newEntity;
            });
        },
        [dispatch, collapsed, setEntity]
    );

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
                    dispatch(setCollapsed(true));
                }
            }
        },
        []
    );

    const handleCollapseKeyDown = React.useCallback(
        (evt) => {
            if (matchKeyMap(evt, KeyMap.overallUI.toggleSidebar)) {
                dispatch(setCollapsed(!collapsed));
                evt.stopPropagation();
                evt.preventDefault();
            }
        },
        [collapsed, dispatch]
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
                <QueryViewNavigator />
            ) : (
                <div />
            );
    }

    const collapseButton = (
        <span
            onClick={() => dispatch(setCollapsed(!collapsed))}
            className="collapse-sidebar-button"
        >
            <Icon name={collapsed ? 'ChevronRight' : 'ChevronLeft'} />
        </span>
    );

    const environmentPickerSection = collapsed ? (
        <div className="collapsed-env flex-center">
            <EnvironmentDropdownButton
                customButtonRenderer={() => (
                    <EnvironmentIcon
                        disabled={false}
                        selected={true}
                        environmentName={currentEnvironment.name}
                    />
                )}
            />
        </div>
    ) : (
        <EnvironmentTopbar />
    );

    const envPickerClassName = clsx({
        'sidebar-environment-picker': true,
        'flex-center': collapsed,
    });

    const contentDOM = (
        <>
            <div className="EnvironmentAppSidebar-content">
                <div className={envPickerClassName}>
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
