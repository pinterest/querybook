import clsx from 'clsx';
import Resizable from 're-resizable';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { DataTableViewMini } from 'components/DataTableViewMini/DataTableViewMini';
import { IDataCell } from 'const/datadoc';
import { useEvent } from 'hooks/useEvent';
import { useResizeToCollapseSidebar } from 'hooks/useResizeToCollapse';
import { enableResizable } from 'lib/utils';
import { getShortcutSymbols, KeyMap, matchKeyMap } from 'lib/utils/keyboard';
import { setSidebarTableId } from 'redux/querybookUI/action';
import { IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { InfoButton } from 'ui/Button/InfoButton';
import { Level } from 'ui/Level/Level';

import { DataDocContents } from './DataDocContents';

import './DataDocLeftSidebar.scss';

interface IProps {
    docId: number;
    cells: IDataCell[];
}

type LeftSidebarContentState = 'contents' | 'table' | 'default';
const TOGGLE_TOC_SHORTCUT = getShortcutSymbols(KeyMap.dataDoc.toggleToC.key);
const DEFAULT_SIDEBAR_WIDTH = 280;

export const DataDocLeftSidebar: React.FunctionComponent<IProps> = ({
    docId,
    cells,
}) => {
    const dispatch = useDispatch();
    const sidebarTableId = useSelector(
        (state: IStoreState) => state.querybookUI.sidebarTableId
    );
    const clearSidebarTableId = () => dispatch(setSidebarTableId(null));

    const [contentState, setContentState] =
        useState<LeftSidebarContentState>('default');

    useEvent(
        'keydown',
        useCallback((evt: KeyboardEvent) => {
            if (matchKeyMap(evt, KeyMap.dataDoc.toggleToC)) {
                setContentState((contentState) => {
                    if (contentState !== 'contents') {
                        return 'contents';
                    }
                    return 'default';
                });
                evt.stopPropagation();
                evt.preventDefault();
            }
        }, [])
    );

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

    const resizeToCollapseSidebar = useResizeToCollapseSidebar(
        DEFAULT_SIDEBAR_WIDTH,
        1 / 3,
        React.useCallback(() => {
            clearSidebarTableId();
            setContentState('default');
        }, [])
    );

    let contentDOM: React.ReactChild;
    if (contentState === 'contents') {
        contentDOM = (
            <div className="sidebar-content sidebar-content-contents">
                <Level className="contents-panel-header">
                    <IconButton
                        icon="ArrowLeft"
                        onClick={() => setContentState('default')}
                    />
                    <div className="flex-row">
                        <span className="mr4">
                            contents ({TOGGLE_TOC_SHORTCUT})
                        </span>
                        <InfoButton layout={['right', 'top']}>
                            Click to jump to the corresponding cell. Drag cells
                            to reorder them.
                        </InfoButton>
                    </div>
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
                <IconButton
                    className="contents-toggle-button"
                    icon="List"
                    onClick={() => setContentState('contents')}
                    color="light"
                    invertCircle
                    size={20}
                    tooltip={`Table of Contents (${TOGGLE_TOC_SHORTCUT})`}
                    tooltipPos="right"
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
            {contentState === 'default' ? (
                <> {contentDOM} </>
            ) : (
                <Resizable
                    defaultSize={{ width: `${DEFAULT_SIDEBAR_WIDTH}px` }}
                    minWidth={DEFAULT_SIDEBAR_WIDTH}
                    enable={enableResizable({ right: true })}
                    onResize={resizeToCollapseSidebar}
                >
                    {contentDOM}
                </Resizable>
            )}
        </div>
    );
};
