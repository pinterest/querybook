import React, {
    useState,
    useRef,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import clsx from 'clsx';

import { TooltipDirection } from 'const/tooltip';
import { titleize, capitalize } from 'lib/utils';
import { QueryEngineStatus, IQueryEngine } from 'const/queryEngine';
import { fetchAllSystemStatus } from 'redux/queryEngine/action';
import { QueryEngineStatusViewer } from 'components/QueryEngineStatusViewer/QueryEngineStatusViewer';
import {
    queryEngineByIdEnvSelector,
    queryEngineStatusAndEngineIdsSelector,
} from 'redux/queryEngine/selector';
import {
    queryEngineStatusToIconStatus,
    queryEngineStatusToMessage,
} from 'const/queryStatusIcon';

import { Popover, PopoverLayout } from 'ui/Popover/Popover';
import { Modal } from 'ui/Modal/Modal';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { Timer, ITimerHandles } from 'ui/Timer/Timer';
import { IconButton } from 'ui/Button/IconButton';
import { Icon } from 'ui/Icon/Icon';

import './QueryEngineStatusButton.scss';
import { Menu, MenuDivider, MenuInfoItem, MenuItem } from 'ui/Menu/Menu';

const REFRESH_INTERVAL = 60;

interface IProps {
    tooltipPos?: TooltipDirection;
    popoverLayout?: PopoverLayout;
}

export const QueryEngineStatusButton: React.FC<IProps> = ({
    tooltipPos = 'right',
    popoverLayout = ['right', 'bottom'] as PopoverLayout,
}) => {
    const [showPanel, setShowPanel] = useState(false);
    const [showStatusForEngineId, setShowStatusForEngineId] = useState<string>(
        null
    );
    const timerRef = useRef<ITimerHandles>();
    const buttonRef = useRef<HTMLAnchorElement>();

    const queryEngineById = useSelector(queryEngineByIdEnvSelector);
    const queryEngineStatusAndEngineIds = useSelector(
        queryEngineStatusAndEngineIdsSelector
    );

    const dispatch = useDispatch();
    const loadAllEngineStatus = useCallback(
        (force?: boolean) => dispatch(fetchAllSystemStatus(force)),
        []
    );

    useEffect(() => {
        loadAllEngineStatus();
    }, [queryEngineById]);

    const timerUpdater = useCallback(
        (timestamp: number) => {
            let newTimeStamp = timestamp - 1;
            if (newTimeStamp <= 0) {
                loadAllEngineStatus(true);
                newTimeStamp = REFRESH_INTERVAL;
            }

            return newTimeStamp;
        },
        [loadAllEngineStatus]
    );

    const timerFormatter = useCallback(
        (timestamp: number) => `Next auto-refresh: ${timestamp}s`,
        []
    );

    const onRefreshClick = useCallback(() => {
        loadAllEngineStatus(true);
        if (timerRef.current) {
            timerRef.current.updateTimer(REFRESH_INTERVAL);
        }
    }, [loadAllEngineStatus, timerRef.current]);

    const overallWorstQueryEngineStatus: QueryEngineStatus = useMemo(
        () =>
            Math.max(
                ...queryEngineStatusAndEngineIds.map(([id, status]) =>
                    Number(status?.data?.status)
                )
            ),
        [queryEngineStatusAndEngineIds]
    );

    const getQueryEngineStatusModal = (engineId: string) => (
        <Modal
            onHide={() => setShowStatusForEngineId(null)}
            title="Query Engine Status"
            className="with-padding"
        >
            <QueryEngineStatusViewer engineId={Number(engineId)} />
        </Modal>
    );

    const getQueryEngineStatusPanelDOM = () => {
        const systemStatusDOM = queryEngineStatusAndEngineIds
            .map(([engineId, engineStatus]) => {
                const engine: IQueryEngine = queryEngineById[engineId];

                let systemStatusContent = null;
                if (!engineStatus || engineStatus.loading) {
                    systemStatusContent = (
                        <span>
                            <i className={'fa fa-spinner fa-pulse'} />
                            {titleize(engine.name)}
                        </span>
                    );
                } else {
                    const warningLevel = engineStatus?.data?.status;
                    const message = capitalize(
                        queryEngineStatusToMessage[warningLevel] ?? ''
                    );
                    const iconClass =
                        queryEngineStatusToIconStatus[warningLevel];

                    systemStatusContent = (
                        <span
                            onClick={() =>
                                setShowStatusForEngineId(String(engineId))
                            }
                        >
                            <StatusIcon status={iconClass} />
                            {titleize(engine.name)}: {message}{' '}
                        </span>
                    );
                }

                return <span key={engineId}>{systemStatusContent}</span>;
            })
            .map((usage, index) => <li key={index}>{usage}</li>);

        const systemStatusSectionDOM = (
            <MenuInfoItem className="QueryEngineStatusPopover-status">
                <span className="mv4">
                    <div className="mb8">Click for details</div>
                    <ul>{systemStatusDOM}</ul>
                </span>
            </MenuInfoItem>
        );

        const panelContent = (
            <div className="QueryEngineStatusPopover">
                <Menu>
                    <MenuInfoItem>
                        <Timer
                            formatter={timerFormatter}
                            updater={timerUpdater}
                            ref={timerRef}
                            initialValue={REFRESH_INTERVAL}
                        />
                    </MenuInfoItem>
                    <MenuDivider />
                    {systemStatusSectionDOM}
                    <MenuDivider />
                    <MenuItem
                        className="QueryEngineStatusPopover-refresh flex-row"
                        onClick={onRefreshClick}
                    >
                        <Icon name="refresh-cw" />
                        <span>Refresh</span>
                    </MenuItem>
                </Menu>
            </div>
        );

        return (
            <Popover
                anchor={buttonRef.current}
                layout={popoverLayout}
                onHide={() => setShowPanel(false)}
                resizeOnChange
            >
                {panelContent}
            </Popover>
        );
    };

    const panel = showPanel && getQueryEngineStatusPanelDOM();
    const modal =
        showStatusForEngineId != null
            ? getQueryEngineStatusModal(showStatusForEngineId)
            : null;

    return (
        <>
            <div
                className={clsx({
                    QueryEngineStatusButton: true,
                    'status-warning':
                        overallWorstQueryEngineStatus ===
                        QueryEngineStatus.WARN,
                    'status-error':
                        overallWorstQueryEngineStatus ===
                        QueryEngineStatus.ERROR,
                })}
            >
                <IconButton
                    className="query-engine-status-button"
                    onClick={() => setShowPanel(true)}
                    ref={buttonRef}
                    icon={'activity'}
                    tooltip={`Summary: ${queryEngineStatusToMessage[overallWorstQueryEngineStatus]}. Click to see details.`}
                    tooltipPos={tooltipPos}
                    title="Engine"
                />
            </div>
            {panel}
            {modal}
        </>
    );
};
