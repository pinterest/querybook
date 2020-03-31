import React, {
    useState,
    useRef,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import classNames from 'classnames';

import { TooltipDirection } from 'const/tooltip';
import { titleize, capitalize } from 'lib/utils';
import { QueryEngineStatus, IQueryEngine } from 'const/queryEngine';
import { fetchAllSystemStatus } from 'redux/queryEngine/action';
import { QueryEngineStatusViewer } from 'components/QueryEngineStatusViewer/QueryEngineStatusViewer';
import {
    queryEngineByIdEnvSelector,
    queryEngineStatusByIdEnvSelector,
} from 'redux/queryEngine/selector';
import {
    queryEngineStatusToIconStatus,
    queryEngineStatusToMessage,
} from 'const/queryStatusIcon';

import { Popover, PopoverLayout } from 'ui/Popover/Popover';
import { Modal } from 'ui/Modal/Modal';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { Timer } from 'ui/Timer/Timer';
import { IconButton } from 'ui/Button/IconButton';
import { Icon } from 'ui/Icon/Icon';

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
    const [showStatusForEngineId, setShowStatusForEngineId] = useState<string>(
        null
    );
    const timerRef = useRef<Timer>();
    const buttonRef = useRef<HTMLAnchorElement>();

    const queryEngineById = useSelector(queryEngineByIdEnvSelector);
    const queryEngineStatusById = useSelector(queryEngineStatusByIdEnvSelector);

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

    const timerFormatter = useCallback((timestamp: number) => {
        return `Next auto-refresh: ${timestamp}s`;
    }, []);

    const onRefreshClick = useCallback(() => {
        loadAllEngineStatus(true);
        if (timerRef.current) {
            timerRef.current.updateTimer(REFRESH_INTERVAL);
        }
    }, [loadAllEngineStatus, timerRef.current]);

    const overallWorstQueryEngineStatus: QueryEngineStatus = useMemo(() => {
        return Math.max(
            ...Object.values(queryEngineStatusById).map((status) =>
                Number(status?.data?.status)
            )
        );
    }, [queryEngineStatusById]);

    const getQueryEngineStatusModal = (engineId: string) => {
        return (
            <Modal
                onHide={() => setShowStatusForEngineId(null)}
                title="Query Engine Status"
                className="with-padding"
            >
                <QueryEngineStatusViewer engineId={Number(engineId)} />
            </Modal>
        );
    };

    const getQueryEngineStatusPanelDOM = () => {
        const systemStatusDOM = Object.entries(queryEngineStatusById)
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
                        queryEngineStatusToMessage[warningLevel]
                    );
                    const iconClass =
                        queryEngineStatusToIconStatus[warningLevel];

                    systemStatusContent = (
                        <span
                            onClick={() => setShowStatusForEngineId(engineId)}
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
            <div className="QueryEngineStatusPopover-status">
                <div>Click for details</div>
                <ul>{systemStatusDOM}</ul>
            </div>
        );

        const panelContent = (
            <div className="QueryEngineStatusPopover">
                <div className="QueryEngineStatusPopover-timer">
                    <Timer
                        formatter={timerFormatter}
                        updater={timerUpdater}
                        ref={timerRef}
                        initialValue={REFRESH_INTERVAL}
                    />
                </div>
                <hr className="dropdown-divider" />
                {systemStatusSectionDOM}
                <hr className="dropdown-divider" />
                <div
                    className="QueryEngineStatusPopover-refresh flex-row"
                    onClick={onRefreshClick}
                >
                    <Icon name="refresh-cw" />
                    <span>Refresh</span>
                </div>
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
                className={classNames({
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
                />
            </div>
            {panel}
            {modal}
        </>
    );
};
