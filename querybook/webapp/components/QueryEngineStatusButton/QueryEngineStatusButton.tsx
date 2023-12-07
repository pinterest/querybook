import clsx from 'clsx';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { QueryEngineStatusViewer } from 'components/QueryEngineStatusViewer/QueryEngineStatusViewer';
import { ComponentType, ElementType } from 'const/analytics';
import { IQueryEngine, QueryEngineStatus } from 'const/queryEngine';
import {
    queryEngineStatusToIconStatus,
    queryEngineStatusToMessage,
} from 'const/queryStatusIcon';
import { TooltipDirection } from 'const/tooltip';
import { trackClick } from 'lib/analytics';
import { capitalize, titleize } from 'lib/utils';
import { fetchAllSystemStatus } from 'redux/queryEngine/action';
import {
    queryEngineByIdEnvSelector,
    queryEngineStatusAndEngineIdsSelector,
} from 'redux/queryEngine/selector';
import { IconButton } from 'ui/Button/IconButton';
import { Icon } from 'ui/Icon/Icon';
import { Menu, MenuDivider, MenuInfoItem, MenuItem } from 'ui/Menu/Menu';
import { Modal } from 'ui/Modal/Modal';
import { Popover, PopoverLayout } from 'ui/Popover/Popover';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { StyledText } from 'ui/StyledText/StyledText';
import { Tag } from 'ui/Tag/Tag';
import { ITimerHandles, Timer } from 'ui/Timer/Timer';

import './QueryEngineStatusButton.scss';

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
    const [showStatusForEngineId, setShowStatusForEngineId] =
        useState<string>(null);
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
        (timestamp: number) => `Auto refresh in ${timestamp}s`,
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
            title={`${titleize(queryEngineById[engineId]?.name)} Status`}
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
                        <>
                            <Icon name="Loading" size={16} className="mr8" />
                            <Tag>{titleize(engine.name)}</Tag>
                        </>
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
                            className="flex-row"
                        >
                            <StatusIcon status={iconClass} />
                            <Tag>{titleize(engine.name)}</Tag>
                            <StyledText className="ml8" color="light">
                                {message}
                            </StyledText>
                        </span>
                    );
                }

                return (
                    <span className="status-row" key={engineId}>
                        {systemStatusContent}
                    </span>
                );
            })
            .map((usage, index) => (
                <MenuItem
                    className="QueryEngineStatusPopover-status"
                    key={index}
                    aria-label="see detailed status"
                    data-balloon-pos="right"
                >
                    {usage}
                </MenuItem>
            ));

        const panelContent = (
            <div className="QueryEngineStatusPopover">
                <Menu height="75vh">
                    <MenuInfoItem>
                        <Timer
                            formatter={timerFormatter}
                            updater={timerUpdater}
                            ref={timerRef}
                            initialValue={REFRESH_INTERVAL}
                        />
                    </MenuInfoItem>
                    <MenuDivider />
                    {systemStatusDOM}
                    <MenuDivider />
                    <MenuItem
                        className="QueryEngineStatusPopover-refresh flex-row"
                        onClick={onRefreshClick}
                    >
                        <Icon name="RefreshCw" />
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
                    onClick={() => {
                        trackClick({
                            component: ComponentType.LEFT_SIDEBAR,
                            element: ElementType.STATUS_BUTTON,
                        });
                        setShowPanel(true);
                    }}
                    ref={buttonRef}
                    icon={'Activity'}
                    tooltip={`Summary: ${queryEngineStatusToMessage[overallWorstQueryEngineStatus]}. Click to see details.`}
                    tooltipPos={tooltipPos}
                    title="Status"
                />
            </div>
            {panel}
            {modal}
        </>
    );
};
