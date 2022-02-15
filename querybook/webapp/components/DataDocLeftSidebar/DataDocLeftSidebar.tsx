import clsx from 'clsx';
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { setSidebarTableId } from 'redux/querybookUI/action';
import { IStoreState } from 'redux/store/types';
import { IDataCell } from 'const/datadoc';

import { DataDocContents } from './DataDocContents';
import { DataTableViewMini } from 'components/DataTableViewMini/DataTableViewMini';

import { Button } from 'ui/Button/Button';
import { Level } from 'ui/Level/Level';
import { IconButton } from 'ui/Button/IconButton';

import './DataDocLeftSidebar.scss';
interface IProps {
    docId: number;
    cells: IDataCell[];
}

type LeftSidebarContentState = 'contents' | 'table' | 'default';

export const DataDocLeftSidebar: React.FunctionComponent<IProps> = ({
    docId,
    cells,
}) => {
    const dispatch = useDispatch();
    const sidebarTableId = useSelector(
        (state: IStoreState) => state.querybookUI.sidebarTableId
    );
    const clearSidebarTableId = () => dispatch(setSidebarTableId(null));

    const [
        contentState,
        setContentState,
    ] = React.useState<LeftSidebarContentState>('default');

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
                    <div>contents</div>
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
                    color="light"
                />
            </div>
        );
    }

    return (
        <div
            className={clsx({
                DataDocLeftSidebar: true,
                hidden: cells.length === 0,
            })}
        >
            {contentDOM}
        </div>
    );
};
