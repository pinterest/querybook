import clsx from 'clsx';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { IQueryEngine, QueryEngineStatus } from 'const/queryEngine';
import { queryEngineStatusToIconStatus } from 'const/queryStatusIcon';
import { TooltipDirection } from 'const/tooltip';
import { getShortcutSymbols, KeyMap } from 'lib/utils/keyboard';
import { queryEngineStatusByIdEnvSelector } from 'redux/queryEngine/selector';
import { AsyncButton, IAsyncButtonHandles } from 'ui/AsyncButton/AsyncButton';
import { Checkbox } from 'ui/Checkbox/Checkbox';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { Icon } from 'ui/Icon/Icon';
import { ListMenu } from 'ui/Menu/ListMenu';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { Tag } from 'ui/Tag/Tag';

import './QueryRunButton.scss';

const EXECUTE_QUERY_SHORTCUT = getShortcutSymbols(
    KeyMap.queryEditor.runQuery.key
);

interface IQueryRunButtonProps extends IQueryEngineSelectorProps {
    disabled?: boolean;
    hasSelection?: boolean;
    runButtonTooltipPos?: TooltipDirection;
    onRunClick: () => any;
    rowLimit?: boolean;
    onRowLimitChange?: (rowLimit: boolean) => void;
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
            rowLimit,
            onRowLimitChange,
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
                icon={hasSelection ? null : <Icon name="Play" fill />}
                aria-label={`Execute (${EXECUTE_QUERY_SHORTCUT})`}
                data-balloon-pos={runButtonTooltipPos}
                color="accent"
            />
        );

        const rowLimitDOM =
            onRowLimitChange &&
            queryEngineById[engineId]?.feature_params.row_limit ? (
                <Checkbox
                    onChange={onRowLimitChange}
                    value={rowLimit}
                    title="Limit results automatically"
                />
            ) : null;

        return (
            <div className="QueryRunButton flex-row ml16">
                {rowLimitDOM}
                <QueryEngineSelector
                    disabled={disabled}
                    queryEngineById={queryEngineById}
                    queryEngines={queryEngines}
                    engineId={engineId}
                    onEngineIdSelect={onEngineIdSelect}
                />
                {runButtonDOM}
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
            <div className="engine-selector-button flex-center ph8">
                <StatusIcon status={iconClass} />
                <div className="ml4">{queryEngineName}</div>
                <Icon
                    name="ChevronDown"
                    className="ml4"
                    size={24}
                    color="light"
                />
            </div>
        );
    };

    const engineItems = queryEngines.map((engineInfo) => ({
        name: <span className="query-engine-name">{engineInfo.name}</span>,
        onClick: onEngineIdSelect.bind(null, engineInfo.id),
        checked: engineInfo.id === engineId,
        tooltip: engineInfo.description,
    }));
    const engineButtonDOM = (
        <Dropdown
            customButtonRenderer={getEngineSelectorButtonDOM}
            layout={['bottom', 'right']}
            className="engine-selector-dropdown"
        >
            <ListMenu items={engineItems} type="select" />
        </Dropdown>
    );

    return disabled ? (
        <Tag className="mr16">{queryEngineById[engineId].name}</Tag>
    ) : (
        <div className="QueryEngineSelector">{engineButtonDOM}</div>
    );
};
