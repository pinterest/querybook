import React from 'react';

import { QueryEngineStatusButton } from 'components/QueryEngineStatusButton/QueryEngineStatusButton';
import { QueryExecutionButton } from 'components/QueryExecutionButton/QueryExecutionButton';
import { DataDocNavigator } from 'components/DataDocNavigator/DataDocNavigator';
import { UserMenu } from 'components/UserMenu/UserMenu';
import { PopoverLayout } from 'ui/Popover/Popover';
import { IconButton } from 'ui/Button/IconButton';
import { Sidebar } from 'ui/Sidebar/Sidebar';

import { CreateDataDocButton } from 'components/CreateDataDocButton/CreateDataDocButton';
import { SearchContainer } from 'components/Search/SearchContainer';
import './DataDocSidebar.scss';

export interface IDataDocSidebarProps {
    collapsed: boolean;
    toggleCollapsed: () => any;
}

export const DataDocSidebar: React.FunctionComponent<IDataDocSidebarProps> = ({
    collapsed,
    toggleCollapsed,
}) => {
    const tooltipPos = collapsed ? 'right' : 'up';
    const popoverLayout: PopoverLayout = collapsed
        ? ['right', 'bottom']
        : ['top', 'left'];
    const controlButtons = (
        <>
            <QueryExecutionButton
                tooltipPos={tooltipPos}
                popoverLayout={popoverLayout}
            />
            <QueryEngineStatusButton
                tooltipPos={tooltipPos}
                popoverLayout={popoverLayout}
            />
            <UserMenu tooltipPos={tooltipPos} popoverLayout={popoverLayout} />
            <IconButton
                icon="sidebar"
                tooltip="Toggle Sidebar"
                tooltipPos={tooltipPos}
                onClick={toggleCollapsed}
            />
        </>
    );

    if (collapsed) {
        return (
            <div className="DataDocSidebar DataDocSidebar-collapsed vertical-space-between">
                <div className="flex-column">
                    <CreateDataDocButton tooltipPos={tooltipPos} />
                    <SearchContainer />
                </div>
                <div className="flex-column">{controlButtons}</div>
            </div>
        );
    }

    return (
        <Sidebar initialWidth={280}>
            <div className={'DataDocSidebar'}>
                <div className="DataDocSidebar-datadocs">
                    <DataDocNavigator />
                </div>
                <div className="DataDocSidebar-footer-lower flex-right">
                    <div>
                        {/* <div className="DataDocSidebar-footer-logo">
                            DataHub
                        </div> */}
                    </div>
                    <div className="flex-row">{controlButtons}</div>
                </div>
            </div>
        </Sidebar>
    );
};
