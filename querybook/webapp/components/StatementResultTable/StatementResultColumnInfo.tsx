import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { columnStatsAnalyzers } from 'lib/query-result/analyzer';
import { getTransformersForType } from 'lib/query-result/transformer';
import { IColumnTransformer } from 'lib/query-result/types';
import { SoftButton } from 'ui/Button/Button';
import { Checkbox } from 'ui/Checkbox/Checkbox';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { makeSelectOptions, Select } from 'ui/Select/Select';
import { Tabs } from 'ui/Tabs/Tabs';
import { Title } from 'ui/Title/Title';

import { IFilterCondition, tableColumnFiltersByType } from './useFilterCell';

const StyledColumnInfo = styled.div.attrs({
    className: 'StatementResultColumnInfo',
})`
    width: 160px;
    font-size: var(--xsmall-text-size);

    .preview-warning {
        word-break: break-word;
        font-weight: var(--bold-font);
        .preview-warning-warning {
            color: var(--color-false-dark);
        }
    }

    .result-statistic {
        word-break: break-all;
    }

    .ColumnInfoMenu {
        .column-name {
            word-break: break-all;

            // css hack to make multiline str look closer together
            line-height: 1;
            margin-top: 1px;
        }
    }
`;

export const ColumnInfoTabs = ['main', 'filter', 'insights'] as const;
export type ColumnInfoTabType = typeof ColumnInfoTabs[number];
export const ColumnInfoTabToIcons: Record<
    ColumnInfoTabType,
    AllLucideIconNames
> = {
    main: 'Menu',
    filter: 'Filter',
    insights: 'Info',
};

interface IColumnInfoProps
    extends IColumnInfoMenuProps,
        IColumnQuickInsightsProps,
        IColumnFilterProps {
    tab: ColumnInfoTabType;
    setTab: (tab: ColumnInfoTabType) => void;
}

export const StatementResultColumnInfo: React.FC<IColumnInfoProps> = ({
    filteredRows,
    colIndex,
    colType,
    isPreview,
    setTransformer,
    transformer,

    filterCondition,
    setFilterCondition,

    colName,
    tab,
    setTab,
}) => {
    const contentDOM =
        tab === 'main' ? (
            <ColumnInfoMenu
                isPreview={isPreview}
                colName={colName}
                colType={colType}
                transformer={transformer}
                setTransformer={setTransformer}
            />
        ) : tab === 'insights' ? (
            <ColumnQuickInsights
                filteredRows={filteredRows}
                colIndex={colIndex}
                colType={colType}
            />
        ) : (
            <ColumnFilter
                colType={colType}
                filterCondition={filterCondition}
                setFilterCondition={setFilterCondition}
            />
        );

    return (
        <StyledColumnInfo>
            <Tabs
                className="PopoverTabs"
                items={ColumnInfoTabs.map((tab) => ({
                    icon: ColumnInfoTabToIcons[tab],
                    tooltip: tab,
                    key: tab,
                }))}
                onSelect={(k: ColumnInfoTabType) => setTab(k)}
                selectedTabKey={tab}
                pills
                align="center"
            />
            <div className="column-content p8">{contentDOM}</div>
        </StyledColumnInfo>
    );
};

interface IColumnInfoMenuProps {
    isPreview: boolean;
    colName: string;
    colType: string;
    transformer: IColumnTransformer;
    setTransformer: (transformer: IColumnTransformer) => any;
}

const ColumnInfoMenu: React.FC<IColumnInfoMenuProps> = ({
    isPreview,
    colName,
    colType,
    transformer,
    setTransformer,
}) => {
    const columnTransformers = useMemo(
        () => getTransformersForType(colType)[0],
        [colType]
    );

    const transformerPicker = columnTransformers.length ? (
        <div className="column-info-section mt4">
            <div className="column-info-header">
                <Title className="mb4" weight="extra" size="small">
                    Transform Result
                </Title>
            </div>
            {columnTransformers.map((colTrans) => (
                <Checkbox
                    className="mb2"
                    key={colTrans.key}
                    title={colTrans.name}
                    value={transformer?.key === colTrans.key}
                    onChange={() =>
                        setTransformer(
                            transformer?.key !== colTrans.key ? colTrans : null
                        )
                    }
                    small
                />
            ))}
        </div>
    ) : null;

    const incompleteDataWarning = isPreview ? (
        <div className="preview-warning mb4">
            <span className="preview-warning-warning">Warning:</span>
            Only analyzing the Preview and not the Full Result.
        </div>
    ) : null;
    const columnHeader = (
        <div className="column-info-section">
            {incompleteDataWarning}
            <div className="column-info-header">
                <div>
                    <Title className="mb4" weight="extra" size="small">
                        Name
                    </Title>
                    <div>{colName}</div>
                </div>
                <div className="mt4">
                    <Title className="mb4" weight="extra" size="small">
                        Type
                    </Title>
                    <div>{colType}</div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="ColumnInfoMenu">
            {columnHeader}
            {transformerPicker}
        </div>
    );
};

interface IColumnQuickInsightsProps {
    colType: string;
    filteredRows: any[][];
    colIndex: number;
}

const ColumnQuickInsights: React.FC<IColumnQuickInsightsProps> = ({
    colType,
    filteredRows,
    colIndex,
}) => {
    const columnValues = useMemo(
        () => filteredRows.map((row) => row[colIndex]),
        [filteredRows, colIndex]
    );
    const statistics = useMemo(() => {
        const statisticsAnalyzers = columnStatsAnalyzers.filter((analyzer) =>
            analyzer.appliesToType.includes(colType)
        );
        return statisticsAnalyzers.map((analyzer) => [
            analyzer.key,
            analyzer.name,
            analyzer.generator(columnValues),
        ]);
    }, [colType, columnValues]);

    const generateStatisticsDOM = () => {
        const statsDOM = statistics.map(([key, name, stat]) => (
            <div key={key} className="result-statistic">
                {name}: {stat}
            </div>
        ));
        return <div>{statsDOM}</div>;
    };

    return statistics.length ? (
        <div className="column-info-section">
            <div className="column-info-header">
                <Title className="mb4" weight="extra" size="small">
                    Quick Insights
                </Title>
            </div>
            <div className="column-dropdown-content">
                {generateStatisticsDOM()}
            </div>
        </div>
    ) : (
        <div className="column-info-section">
            No stats can be inferred from this column.
        </div>
    );
};

interface IColumnFilterProps {
    filterCondition: IFilterCondition | null;
    setFilterCondition: (cond: IFilterCondition | null) => void;
    colType: string;
}

const ColumnFilter: React.FC<IColumnFilterProps> = ({
    filterCondition,
    setFilterCondition,
    colType,
}) => {
    const clearFilterCondition = useCallback(
        () => setFilterCondition(null),
        []
    );
    const [tableColumnFilters, filterType] = useMemo(() => {
        if (colType === 'number') {
            return [tableColumnFiltersByType.num, 'num'] as const;
        }
        return [tableColumnFiltersByType.str, 'str'] as const;
    }, [colType]);

    const setFilterConditionName = useCallback(
        (name: string) => {
            if (!tableColumnFilters.has(name)) {
                clearFilterCondition();
                return;
            }

            const numInputs = tableColumnFilters.get(name).numInputs;
            const newConditions = resizeArray(
                filterCondition?.conditions,
                numInputs,
                ''
            );

            setFilterCondition({
                type: filterType,
                name,
                conditions: newConditions,
            });
        },
        [filterType, filterCondition, tableColumnFilters]
    );

    const setFilterConditionInputs = useCallback(
        (index: number, value: string) => {
            const conditions = [...filterCondition.conditions];
            conditions[index] = value;
            setFilterCondition({
                ...filterCondition,
                conditions,
            });
        },
        [filterType, filterCondition]
    );

    return (
        <div className="column-info-section">
            {filterCondition && (
                <div className="right-align mb8">
                    <SoftButton title="Clear" onClick={clearFilterCondition} />
                </div>
            )}

            <div>
                <Select
                    value={filterCondition?.name}
                    onChange={(evt) => setFilterConditionName(evt.target.value)}
                    fullWidth
                    withDeselect
                >
                    {makeSelectOptions([...tableColumnFilters.keys()])}
                </Select>
            </div>
            <div>
                {filterCondition?.conditions.map((condition, index) => (
                    <DebouncedInput
                        className="mt8"
                        key={index}
                        value={condition}
                        onChange={(value) =>
                            setFilterConditionInputs(index, value)
                        }
                    />
                ))}
            </div>
        </div>
    );
};

function resizeArray<T = any>(arr: T[], toSize: number, defaultVal: T) {
    const copy = arr ? [...arr] : [];
    while (copy.length > toSize) {
        copy.pop();
    }
    while (copy.length < toSize) {
        copy.push(defaultVal);
    }
    return copy;
}
