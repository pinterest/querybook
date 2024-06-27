import clsx from 'clsx';
import * as React from 'react';
import { useState } from 'react';
import { useSelector } from 'react-redux';

import PublicConfig from 'config/querybook_public_config.yaml';
import { IQueryEngine, QueryEngineStatus } from 'const/queryEngine';
import { queryEngineStatusToIconStatus } from 'const/queryStatusIcon';
import { TooltipDirection } from 'const/tooltip';
import { MIN_ENGINE_TO_SHOW_FILTER } from 'const/uiConfig';
import {
    ALLOW_UNLIMITED_QUERY,
    DEFAULT_ROW_LIMIT,
    ROW_LIMIT_SCALE,
} from 'lib/sql-helper/sql-limiter';
import { getShortcutSymbols, KeyMap } from 'lib/utils/keyboard';
import { stopPropagation } from 'lib/utils/noop';
import { formatNumber } from 'lib/utils/number';
import { queryEngineStatusByIdEnvSelector } from 'redux/queryEngine/selector';
import { AsyncButton, IAsyncButtonHandles } from 'ui/AsyncButton/AsyncButton';
import { IconButton } from 'ui/Button/IconButton';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { Icon } from 'ui/Icon/Icon';
import { ListMenu } from 'ui/Menu/ListMenu';
import { SearchBar } from 'ui/SearchBar/SearchBar';
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

    rowLimit?: number;
    onRunClick: () => any;
    onRowLimitChange?: (rowLimit: number) => void;

    hasSamplingTables?: boolean;
    sampleRate?: number;
    onSampleRateChange?: (sampleRate: number) => void;
    onTableSamplingInfoClick?: () => void;
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

            hasSamplingTables,
            sampleRate,
            onSampleRateChange,
            onTableSamplingInfoClick,
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

        const tableSamplingDOM =
            !disabled && TABLE_SAMPLING_CONFIG.enabled && hasSamplingTables ? (
                <TableSamplingSelector
                    sampleRate={sampleRate}
                    setSampleRate={onSampleRateChange}
                    tooltipPos={runButtonTooltipPos}
                    onTableSamplingInfoClick={onTableSamplingInfoClick}
                />
            ) : null;

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
                {tableSamplingDOM}
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
                {queryEngines.length >= MIN_ENGINE_TO_SHOW_FILTER && (
                    <div onClick={stopPropagation}>
                        <SearchBar
                            value={keyword}
                            onSearch={setKeyword}
                            placeholder="Search"
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

export const SamplingInfoButton: React.FC<{
    tooltipPos: TooltipDirection;
    onSamplingInfoClick: () => void;
    size: number;
}> = ({ tooltipPos, onSamplingInfoClick, size }) => (
    <div
        className="flex-center"
        aria-label="Click to see how table sampling works"
        data-balloon-pos={tooltipPos}
    >
        <IconButton icon="Info" size={size} onClick={onSamplingInfoClick} />
    </div>
);

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

const TABLE_SAMPLING_CONFIG = PublicConfig.table_sampling ?? {
    enabled: false,
    sample_rates: [],
    default_sample_rate: 0,
};
const sampleRateOptions = [{ label: 'none', value: 0 }].concat(
    TABLE_SAMPLING_CONFIG.sample_rates.map((value) => ({
        label: value + '%',
        value,
    }))
);
const DEFAULT_SAMPLE_RATE = TABLE_SAMPLING_CONFIG.default_sample_rate;
const TableSamplingSelector: React.FC<{
    sampleRate: number;
    setSampleRate: (sampleRate: number) => void;
    tooltipPos: TooltipDirection;
    onTableSamplingInfoClick: () => void;
}> = ({ sampleRate, setSampleRate, tooltipPos, onTableSamplingInfoClick }) => {
    React.useEffect(() => {
        if (!sampleRateOptions.some((option) => option.value === sampleRate)) {
            setSampleRate(DEFAULT_SAMPLE_RATE);
        }
    }, [sampleRate, setSampleRate]);

    const selectedSampleRateText = React.useMemo(() => {
        if (sampleRate > 0) {
            return sampleRate + '%';
        }
        return 'none';
    }, [sampleRate]);

    const sampleRateMenuItems = sampleRateOptions.map((option) => ({
        name: <span>{option.label}</span>,
        onClick: () => setSampleRate(option.value),
        checked: option.value === sampleRate,
    }));

    return (
        <Dropdown
            customButtonRenderer={() => (
                <div className="flex-row">
                    <SamplingInfoButton
                        tooltipPos={tooltipPos}
                        onSamplingInfoClick={onTableSamplingInfoClick}
                        size={20}
                    />
                    <div
                        className="flex-center"
                        aria-label="Only applies to tables support sampling"
                        data-balloon-pos={tooltipPos}
                    >
                        <span className="mr4">
                            Sample: {selectedSampleRateText}
                        </span>
                        <Icon name="ChevronDown" size={24} color="light" />
                    </div>
                </div>
            )}
            layout={['bottom', 'right']}
        >
            <ListMenu items={sampleRateMenuItems} type="select" />
        </Dropdown>
    );
};
