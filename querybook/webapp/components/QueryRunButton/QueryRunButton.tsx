import clsx from 'clsx';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { IQueryEngine, QueryEngineStatus } from 'const/queryEngine';
import { queryEngineStatusToIconStatus } from 'const/queryStatusIcon';
import { TooltipDirection } from 'const/tooltip';
import { DEFAULT_ROW_LIMIT, ROW_LIMIT_SCALE } from 'lib/sql-helper/sql-limiter';
import { getShortcutSymbols, KeyMap } from 'lib/utils/keyboard';
import { formatNumber } from 'lib/utils/number';
import { queryEngineStatusByIdEnvSelector } from 'redux/queryEngine/selector';
import { AsyncButton, IAsyncButtonHandles } from 'ui/AsyncButton/AsyncButton';
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
    hasLintError: boolean;

    rowLimit?: number;
    onRunClick: () => any;
    onRowLimitChange?: (rowLimit: number) => void;
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
            hasLintError,
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
                title={
                    hasLintError ? null : hasSelection ? 'Run Selection' : null
                }
                icon={
                    hasLintError ? (
                        <Icon name="AlertCircle" />
                    ) : hasSelection ? null : (
                        <Icon name="Play" fill />
                    )
                }
                aria-label={
                    hasLintError
                        ? 'Validation failed, click to run anyway'
                        : `Run (${EXECUTE_QUERY_SHORTCUT})`
                }
                data-balloon-length="fit"
                data-balloon-pos={runButtonTooltipPos}
                color={hasLintError ? 'cancel' : 'accent'}
            />
        );

        const isRowLimitEnabled =
            queryEngineById[engineId]?.feature_params.row_limit;
        const rowLimitDOM =
            onRowLimitChange && isRowLimitEnabled ? (
                <QueryLimitSelector
                    rowLimit={rowLimit}
                    setRowLimit={onRowLimitChange}
                    tooltipPos={runButtonTooltipPos}
                />
            ) : null;

        return (
            <div className="QueryRunButton flex-row ml16">
                <QueryEngineSelector
                    disabled={disabled}
                    queryEngineById={queryEngineById}
                    queryEngines={queryEngines}
                    engineId={engineId}
                    onEngineIdSelect={onEngineIdSelect}
                />
                {rowLimitDOM}
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

const rowLimitOptions = ROW_LIMIT_SCALE.map((value) => ({
    label: formatNumber(value),
    value,
}));

const QueryLimitSelector: React.FC<{
    rowLimit: number;
    setRowLimit: (rowLimit: number) => void;
    tooltipPos: TooltipDirection;
}> = ({ rowLimit, setRowLimit, tooltipPos }) => {
    React.useEffect(() => {
        if (!rowLimitOptions.some((option) => option.value === rowLimit)) {
            setRowLimit(DEFAULT_ROW_LIMIT);
        }
    }, [rowLimit, setRowLimit]);

    const rowLimitMenuItems = rowLimitOptions.map((option) => ({
        name: <span>{option.label}</span>,
        onClick: () => setRowLimit(option.value),
        checked: option.value === rowLimit,
    }));

    return (
        <Dropdown
            customButtonRenderer={() => (
                <div
                    className="flex-center ph4"
                    aria-label="Only applies to select statements without limit"
                    data-balloon-pos={tooltipPos}
                >
                    <span className="mr4">Limit: {formatNumber(rowLimit)}</span>
                    <Icon name="ChevronDown" size={24} color="light" />
                </div>
            )}
            layout={['bottom', 'right']}
        >
            <ListMenu items={rowLimitMenuItems} type="select" />
        </Dropdown>
    );
};
