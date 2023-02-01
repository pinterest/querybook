import clsx from 'clsx';
import * as React from 'react';
import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { IQueryEngine, QueryEngineStatus } from 'const/queryEngine';
import { queryEngineStatusToIconStatus } from 'const/queryStatusIcon';
import { TooltipDirection } from 'const/tooltip';
import {
    ALLOW_UNLIMITED_QUERY,
    DEFAULT_ROW_LIMIT,
    ROW_LIMIT_SCALE,
} from 'lib/sql-helper/sql-limiter';
import { getShortcutSymbols, KeyMap } from 'lib/utils/keyboard';
import { formatNumber } from 'lib/utils/number';
import { stopPropagation } from 'lib/utils/noop';
import { queryEngineStatusByIdEnvSelector } from 'redux/queryEngine/selector';
import { AsyncButton, IAsyncButtonHandles } from 'ui/AsyncButton/AsyncButton';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { Icon } from 'ui/Icon/Icon';
import { ListMenu } from 'ui/Menu/ListMenu';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { Tag } from 'ui/Tag/Tag';
import { SearchBar } from 'ui/SearchBar/SearchBar';

import './QueryRunButton.scss';

const EXECUTE_QUERY_SHORTCUT = getShortcutSymbols(
    KeyMap.queryEditor.runQuery.key
);

interface IQueryRunButtonProps extends IQueryEngineSelectorProps {
    disabled?: boolean;
    hasSelection?: boolean;
    runButtonTooltipPos?: TooltipDirection;

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
                aria-label={`Run (${EXECUTE_QUERY_SHORTCUT})`}
                data-balloon-length="fit"
                data-balloon-pos={runButtonTooltipPos}
                color={'accent'}
            />
        );

        const isRowLimitEnabled =
            queryEngineById[engineId]?.feature_params.row_limit;
        const rowLimitDOM =
            !disabled && onRowLimitChange && isRowLimitEnabled ? (
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

    const [keyword, setKeyword] = useState('');

    const engineItems = queryEngines
        .filter((engineInfo) =>
            `${engineInfo.name.toLowerCase()}`.includes(keyword.toLowerCase())
        )
        .map((engineInfo) => ({
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
            <div className="engine-selector-wrapper">
                {queryEngines.length > 3 && (
                    <div onClick={stopPropagation}>
                        <SearchBar
                            value={keyword}
                            onSearch={setKeyword}
                            placeholder="Search"
                            transparent
                            delayMethod="throttle"
                            hasClearSearch={true}
                        />
                    </div>
                )}
                <ListMenu items={engineItems} type="select" />
            </div>
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
})).concat(ALLOW_UNLIMITED_QUERY ? [{ label: 'none', value: -1 }] : []);

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

    const selectedRowLimitText = React.useMemo(() => {
        if (rowLimit >= 0) {
            return formatNumber(rowLimit);
        }
        return 'none';
    }, [rowLimit]);

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
                    aria-label="Only applies to SELECT query without LIMIT"
                    data-balloon-pos={tooltipPos}
                >
                    <span className="mr4">Limit: {selectedRowLimitText}</span>
                    <Icon name="ChevronDown" size={24} color="light" />
                </div>
            )}
            layout={['bottom', 'right']}
        >
            <ListMenu items={rowLimitMenuItems} type="select" />
        </Dropdown>
    );
};
