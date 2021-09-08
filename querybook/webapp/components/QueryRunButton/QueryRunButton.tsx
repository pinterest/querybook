import clsx from 'clsx';
import * as React from 'react';

import { useSelector } from 'react-redux';
import { queryEngineStatusByIdEnvSelector } from 'redux/queryEngine/selector';
import { IQueryEngine, QueryEngineStatus } from 'const/queryEngine';
import { queryEngineStatusToIconStatus } from 'const/queryStatusIcon';
import { TooltipDirection } from 'const/tooltip';
import { getShortcutSymbols, KeyMap } from 'lib/utils/keyboard';

import { AsyncButton, IAsyncButtonHandles } from 'ui/AsyncButton/AsyncButton';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { ListMenu } from 'ui/Menu/ListMenu';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';

import './QueryRunButton.scss';

const EXECUTE_QUERY_SHORTCUT = getShortcutSymbols(
    KeyMap.queryEditor.runQuery.key
);

interface IQueryRunButtonProps extends IQueryEngineSelectorProps {
    disabled?: boolean;
    hasSelection?: boolean;
    runButtonTooltipPos?: TooltipDirection;
    onRunClick: () => any;
}

export interface IQueryRunButtonHandles {
    clickRunButton(): void;
}

export const QueryRunButton = React.forwardRef<
    IQueryRunButtonHandles,
    IQueryRunButtonProps
>(
    (
        {
            disabled,
            hasSelection,
            runButtonTooltipPos = 'up',
            onRunClick,
            queryEngineById,
            queryEngines,
            engineId,
            onEngineIdSelect,
        },
        ref
    ) => {
        const runButtonRef = React.useRef<IAsyncButtonHandles>();

        React.useImperativeHandle(
            ref,
            () => ({
                clickRunButton: () => {
                    if (runButtonRef.current) {
                        runButtonRef.current.onClick();
                    }
                },
            }),
            []
        );

        const runButtonDOM = disabled ? null : (
            <AsyncButton
                onClick={onRunClick}
                ref={runButtonRef}
                className={clsx({
                    'run-selection': !!hasSelection,
                })}
                title={hasSelection ? 'Run Selection' : null}
                icon={hasSelection ? null : 'play'}
                aria-label={`Execute (${EXECUTE_QUERY_SHORTCUT})`}
                data-balloon-pos={runButtonTooltipPos}
                attached="right"
            />
        );

        return (
            <div className="QueryRunButton flex-row">
                {runButtonDOM}
                <QueryEngineSelector
                    disabled={disabled}
                    queryEngineById={queryEngineById}
                    queryEngines={queryEngines}
                    engineId={engineId}
                    onEngineIdSelect={onEngineIdSelect}
                />
            </div>
        );
    }
);

interface IQueryEngineSelectorProps {
    disabled?: boolean;

    queryEngineById: Record<number, IQueryEngine>;
    queryEngines: IQueryEngine[];
    engineId: number;
    onEngineIdSelect: (id: number) => any;
}
export const QueryEngineSelector: React.FC<IQueryEngineSelectorProps> = ({
    queryEngineById,
    queryEngines,
    engineId,
    onEngineIdSelect,
    disabled,
}) => {
    const queryEngineStatusById = useSelector(queryEngineStatusByIdEnvSelector);

    const getEngineSelectorButtonDOM = () => {
        const engineStatus = queryEngineStatusById[engineId];
        const warningLevel =
            engineStatus?.data?.status ?? QueryEngineStatus.UNAVAILABLE;
        const iconClass = queryEngineStatusToIconStatus[warningLevel];

        const queryEngineName = queryEngineById[engineId].name;

        return (
            <div className="engine-selector-button flex-row">
                <StatusIcon status={iconClass} />{' '}
                <span>
                    {queryEngineName}{' '}
                    <i className="fa fa-caret-down caret-icon" />
                </span>
            </div>
        );
    };

    let engineButtonDOM = null;
    if (!disabled) {
        const engineItems = queryEngines.map((engineInfo) => ({
            name: <span className="query-engine-name">{engineInfo.name}</span>,
            onClick: onEngineIdSelect.bind(null, engineInfo.id),
            checked: engineInfo.id === engineId,
            tooltip: engineInfo.description,
        }));
        engineButtonDOM = (
            <Dropdown customButtonRenderer={getEngineSelectorButtonDOM} isRight>
                <ListMenu items={engineItems} type="select" isRight />
            </Dropdown>
        );
    } else {
        engineButtonDOM = queryEngineById[engineId].name;
    }

    return (
        <div
            className={clsx({
                QueryEngineSelector: true,
                readonly: disabled,
            })}
        >
            {engineButtonDOM}
        </div>
    );
};
