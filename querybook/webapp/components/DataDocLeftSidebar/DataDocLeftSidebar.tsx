import classNames from 'classnames';
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { setSidebarTableId } from 'redux/querybookUI/action';
import { IStoreState } from 'redux/store/types';
import { IDataCell } from 'const/datadoc';
import { Button } from 'ui/Button/Button';
import { Level } from 'ui/Level/Level';
import { IconButton } from 'ui/Button/IconButton';
import { Title } from 'ui/Title/Title';
import './DataDocLeftSidebar.scss';
import { DataDocContents } from './DataDocContents';
import { DataTableViewMini } from 'components/DataTableViewMini/DataTableViewMini';

interface IProps {
    docId: number;
    cells: IDataCell[];
    onCollapse: () => any;
    defaultCollapse: boolean;
}

type LeftSidebarContentState = 'contents' | 'table' | 'default';

export const DataDocLeftSidebar: React.FunctionComponent<IProps> = ({
    docId,
    cells,
    defaultCollapse,
    onCollapse,
}) => {
    const dispatch = useDispatch();
    const sidebarTableId = useSelector(
        (state: IStoreState) => state.querybookUI.sidebarTableId
    );
    const clearSidebarTableId = () => dispatch(setSidebarTableId(null));

    const [contentState, setContentState] = React.useState<
        LeftSidebarContentState
    >('default');

    useEffect(
        () => () => {
            clearSidebarTableId();
            setContentState('default');
        },
        []
    );
    useEffect(() => {
        if (sidebarTableId != null) {
            setContentState('table');
        } else if (contentState === 'table') {
            // if table id is cleared and sidebar is still trying to show table
            setContentState('default');
        }
    }, [sidebarTableId]);

    let contentDOM: React.ReactChild;
    if (contentState === 'contents') {
        contentDOM = (
            <div className="sidebar-content sidebar-content-contents">
                <Level className="contents-panel-header">
                    <IconButton
                        icon="arrow-left"
                        onClick={() => setContentState('default')}
                    />
                    <Title size={6}>contents</Title>
                </Level>
                <DataDocContents cells={cells} docId={docId} />
            </div>
        );
    } else if (contentState === 'table') {
        contentDOM = (
            <div className="sidebar-content sidebar-content-table">
                <DataTableViewMini
                    tableId={sidebarTableId}
                    onHide={() => clearSidebarTableId()}
                />
            </div>
        );
    } else {
        contentDOM = (
            <div className={'sidebar-content sidebar-content-default'}>
                <Button
                    className="contents-toggle-button"
                    icon="list"
                    attached="left"
                    onClick={() => setContentState('contents')}
                    aria-label="Show doc contents"
                    data-balloon-pos="right"
                />
                <br />
                <IconButton
                    icon={defaultCollapse ? 'maximize' : 'minimize'}
                    tooltip={
                        defaultCollapse
                            ? 'Uncollapse all cells'
                            : 'Collapse all cells'
                    }
                    tooltipPos="right"
                    onClick={onCollapse}
                />
            </div>
        );
    }

    return (
        <div
            className={classNames({
                DataDocLeftSidebar: true,
                hidden: cells.length === 0,
            })}
        >
            {contentDOM}
        </div>
    );
};
