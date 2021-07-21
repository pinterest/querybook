import * as React from 'react';
import { useSelector } from 'react-redux';

import { Field, withFormik, FormikProps } from 'formik';
import produce from 'immer';
import { isEmpty, range } from 'lodash';
import Select from 'react-select';

import { IStoreState } from 'redux/store/types';
import { IDataChartCellMeta } from 'const/datadoc';
import {
    IChartFormValues,
    ChartDataAggType,
    formTabs,
    tableTabs,
    sourceTypes,
    chartTypes,
    aggTypes,
    IChartAxisMeta,
    ChartScaleType,
    chartValueDisplayType,
    ChartScaleOptions,
    chartTypeToAllowedAxisType,
} from 'const/dataDocChart';
import { colorPalette, colorPaletteNames } from 'const/chartColors';

import { defaultReactSelectStyles } from 'lib/utils/react-select';
import { mapMetaToFormVals } from 'lib/chart/chart-meta-processing';
import { transformData } from 'lib/chart/chart-data-transformation';
import { useChartSource } from 'hooks/chart/useChartSource';

import { QueryExecutionPicker } from 'components/ExecutionPicker/QueryExecutionPicker';
import { StatementExecutionPicker } from 'components/ExecutionPicker/StatementExecutionPicker';
import { StatementResultTable } from 'components/StatementResultTable/StatementResultTable';
import { queryCellSelector } from 'redux/dataDoc/selector';

import { SoftButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { ErrorBoundary } from 'ui/ErrorBoundary/ErrorBoundary';
import { FormField, FormSectionHeader } from 'ui/Form/FormField';
import { Tabs } from 'ui/Tabs/Tabs';

import { Level, LevelItem } from 'ui/Level/Level';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';
import { getDefaultScaleType } from 'lib/chart/chart-utils';
import { NumberField } from 'ui/FormikField/NumberField';
import { ReactSelectField } from 'ui/FormikField/ReactSelectField';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';
import { DisabledSection } from 'ui/DisabledSection/DisabledSection';

import { DataDocChart } from './DataDocChart';
import { DataDocChartCellTable } from './DataDocChartCellTable';
import './DataDocChartComposer.scss';

interface IProps {
    meta?: IDataChartCellMeta;
    dataDocId?: number;
    cellAboveId?: number;
    onUpdateChartConfig: (meta: IDataChartCellMeta) => any;
    isEditable: boolean;
}

const DataDocChartComposerComponent: React.FunctionComponent<
    IProps & FormikProps<IChartFormValues>
> = ({
    meta,
    dataDocId,
    cellAboveId,
    values,
    dirty,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
    isEditable,
}) => {
    const [formTab, setFormTab] = React.useState<'data' | 'chart' | 'visuals'>(
        'data'
    );
    const [showTable, setShowTable] = React.useState(true);
    // const [showSeriesAggTypes, setShowSeriesAggTypes] = React.useState<boolean>(
    //     !values.aggType || !Object.keys(values.aggSeries).length
    // );
    const [tableTab, setTableTab] = React.useState<'original' | 'transformed'>(
        values.aggregate || values.switch ? 'transformed' : 'original'
    );

    const [displayExecutionId, setDisplayExecutionId] = React.useState(
        values.executionId
    );
    const [displayStatementId, setDisplayStatementId] = React.useState(
        undefined
    );

    const {
        statementResultData,
        queryExecutions,
        statementExecutions,
    } = useChartSource(
        values.cellId,
        displayExecutionId,
        displayStatementId,
        setFieldValue.bind(null, 'cellId'),
        setFieldValue.bind(null, 'executionId'),
        setDisplayStatementId
    );

    const chartData = React.useMemo(
        () =>
            statementResultData
                ? transformData(
                      statementResultData,
                      values.aggregate,
                      values.switch,
                      values.formatAggCol,
                      values.formatSeriesCol,
                      values.formatValueCols,
                      values.aggSeries,
                      values.sortIndex,
                      values.sortAsc,
                      values.xIndex
                  )
                : null,
        [
            statementResultData,
            values.aggregate,
            values.switch,
            values.formatAggCol,
            values.formatSeriesCol,
            values.formatValueCols,
            values.aggType,
            values.aggSeries,
            values.sortIndex,
            values.sortAsc,
            values.xIndex,
        ]
    );

    // getting redux state
    const queryCellOptions = useSelector((state: IStoreState) =>
        queryCellSelector(state, dataDocId)
    );

    React.useEffect(() => {
        if (
            values.sourceType === 'cell_above' &&
            values.cellId !== cellAboveId
        ) {
            setFieldValue('cellId', cellAboveId);
        } else if (
            (values.sourceType === 'cell' ||
                values.sourceType === 'execution') &&
            values.cellId == null
        ) {
            setFieldValue('cellId', cellAboveId ?? queryCellOptions?.[0].id);
        }
    }, [values.sourceType]);

    React.useEffect(() => {
        if (chartData && values.aggType) {
            handleAggTypeChange(values.aggType);
        }
    }, [(chartData || [])[0]?.length]);

    React.useEffect(() => {
        setDisplayExecutionId(values.executionId);
    }, [values.executionId]);

    // ------------- select options ------------------------------------------------------------------
    const cellExecutionOptions = React.useMemo(() => {
        if (queryExecutions) {
            return queryExecutions.map((queryExecution) => ({
                value: queryExecution.id,
                label: `Execution ${queryExecution.id}`,
            }));
        } else if (displayExecutionId) {
            return [
                {
                    value: displayExecutionId,
                    label: `Execution ${displayExecutionId}`,
                },
            ];
        } else {
            return [
                {
                    value: -1,
                    label: `loading executions`,
                },
            ];
        }
    }, [displayExecutionId, queryExecutions]);

    const xAxisOptions = React.useMemo(() => {
        if (!chartData) {
            return [];
        }
        return chartData[0].map((col, idx) => ({
            value: idx,
            label: col,
        }));
    }, [chartData]);

    const formatAggByOptions = React.useMemo(() => {
        if (!statementResultData) {
            return [];
        }
        const options = statementResultData[0]
            .filter((label, idx) => idx !== values.formatSeriesCol)
            .map((label, idx) => ({
                value: idx,
                label,
            }));
        return options;
    }, [statementResultData, values.formatAggCol, values.formatSeriesCol]);

    const makeFormatSeriesOptions = React.useMemo(() => {
        if (!statementResultData) {
            return [];
        }
        const columns = statementResultData[0];
        const options = [];
        for (let i = 0; i < columns.length; i++) {
            if (i !== values.formatAggCol) {
                options.push({
                    value: i,
                    label: columns[i],
                });
            }
        }
        return options;
    }, [statementResultData, values.formatAggCol]);

    const makeFormatValueOptions = React.useMemo(() => {
        if (!statementResultData) {
            return [];
        }
        const columns = statementResultData[0];
        const options = [];
        for (let i = 0; i < columns.length; i++) {
            if (i !== values.xIndex && i !== values.formatSeriesCol) {
                options.push({
                    value: i,
                    label: columns[i],
                });
            }
        }
        return options;
    }, [statementResultData, values.formatAggCol, values.formatSeriesCol]);

    const makeSeriesValsAndOptions = React.useCallback(
        (selectedValues: boolean) => {
            if (!chartData || !chartData.length) {
                return [{ value: 0, label: 'loading series' }];
            }
            const valsArray = chartData[0];
            const optionIdxs = selectedValues
                ? range(valsArray.length).filter(
                      (val) =>
                          !values.hiddenSeries.includes(val) &&
                          val !== values.xIndex
                  )
                : values.hiddenSeries;
            const options = optionIdxs.map((i) => ({
                value: i,
                label: valsArray[i],
                color:
                    colorPalette[
                        values.coloredSeries[i] ?? i % colorPalette.length
                    ],
            }));
            return options;
        },
        [chartData, values.xIndex, values.hiddenSeries, values.coloredSeries]
    );

    const getAxesScaleType = React.useCallback(
        (colIndex: number) => {
            for (let row = 1; row < chartData?.length; row++) {
                const cell = chartData?.[row]?.[colIndex];
                if (cell != null) {
                    return getDefaultScaleType(chartData?.[row]?.[colIndex]);
                }
            }
            // Unknown type, use linear as a default
            return 'linear';
        },
        [chartData]
    );

    const seriesColorOptions = colorPaletteNames.map((color, idx) => ({
        value: idx,
        label: color,
        color: colorPalette[idx],
    }));

    const seriesAggOptions = Object.entries(aggTypes).map(([val, key]) => ({
        value: val as ChartDataAggType,
        label: key,
    }));

    // ------------- event handlers ------------------------------------------------------------------
    const handleHiddenSeriesChange = (
        selectedVals: Array<{ value: number; label: string }>
    ) => {
        const hiddenSeries = [];
        const selectedSeries = selectedVals.map((obj) => obj.value);
        for (let i = 0; i < chartData[0].length; i++) {
            if (i !== values.xIndex && !selectedSeries.includes(i)) {
                hiddenSeries.push(i);
            }
        }
        setFieldValue('hiddenSeries', hiddenSeries);
    };

    const handleAggTypeChange = (aggType: ChartDataAggType) => {
        setFieldValue('aggType', aggType);

        const newAggSeries = {};
        for (let i = 0; i < chartData[0].length; i++) {
            newAggSeries[i] = aggType;
        }
        setFieldValue('aggSeries', newAggSeries);
    };

    // ------------- DOM elements ------------------------------------------------------------------
    const tabsDOM = (
        <Tabs
            selectedTabKey={formTab}
            onSelect={(selectedTab: 'data' | 'chart' | 'visuals') =>
                setFormTab(selectedTab)
            }
            items={formTabs}
            wide
        />
    );

    const dataSourceDOM = (
        <>
            <FormSectionHeader>Source</FormSectionHeader>
            <FormField stacked label="Type">
                <SimpleReactSelect
                    value={values.sourceType}
                    onChange={(val) => {
                        if (
                            values.sourceType === 'execution' &&
                            val !== 'execution'
                        ) {
                            setFieldValue('executionId', null);
                        }
                        setFieldValue('sourceType', val);
                    }}
                    options={Object.entries(sourceTypes).map(([key, val]) => ({
                        value: key,
                        label: val,
                    }))}
                />
            </FormField>
            {values.sourceType !== 'cell_above' ? (
                <FormField stacked label="Cell">
                    <ReactSelectField
                        name="cellId"
                        options={queryCellOptions.map((val) => ({
                            value: val.id,
                            label: val.title,
                        }))}
                    />
                </FormField>
            ) : null}
            {values.sourceType === 'execution' ? (
                <SimpleField
                    stacked
                    type="react-select"
                    options={cellExecutionOptions}
                    name="executionId"
                    label="Execution"
                />
            ) : null}
        </>
    );

    const dataTransformationDOM = (
        <>
            <FormSectionHeader>Transformation</FormSectionHeader>
            <SimpleField
                type="checkbox"
                name="aggregate"
                label="Aggregate"
                onChange={(val) => {
                    setFieldValue('aggregate', val);
                    setFieldValue('hiddenSeries', []);
                    if (val) {
                        handleAggTypeChange('sum');
                        setTableTab('transformed');
                    } else {
                        setFieldValue('aggType', undefined);
                        setFieldValue('aggSeries', {});
                    }
                }}
                help="By default, all rows will be aggregated"
            />
            {values.aggregate ? (
                <>
                    <FormField stacked label="Aggregate By">
                        <SimpleReactSelect
                            value={values.aggType}
                            onChange={(val) => handleAggTypeChange(val)}
                            options={seriesAggOptions}
                        />
                    </FormField>
                    <div className="DataDocChartComposer-info m8">
                        Value must be selected for aggregation by row/column.
                    </div>
                    <SimpleField
                        stacked
                        type="react-select"
                        label="Row"
                        name="formatAggCol"
                        options={formatAggByOptions}
                        isDisabled={!statementResultData}
                        withDeselect
                    />
                    <SimpleField
                        stacked
                        label="Column"
                        type="react-select"
                        name="formatSeriesCol"
                        options={makeFormatSeriesOptions}
                        isDisabled={!statementResultData}
                        withDeselect
                    />
                    <SimpleField
                        stacked
                        label="Value"
                        type="react-select"
                        name="formatValueCols"
                        value={values.formatValueCols[0]}
                        options={makeFormatValueOptions}
                        isDisabled={!statementResultData}
                        onChange={(val) => {
                            if (val == null) {
                                setFieldValue('formatValueCols', []);
                            } else {
                                setFieldValue('formatValueCols', [val]);
                            }
                        }}
                        withDeselect
                    />
                </>
            ) : null}
            <SimpleField
                type="checkbox"
                label="Switch Rows/Columns"
                name="switch"
                help="Switch is applied after aggregation"
            />
        </>
    );

    const dataTabDOM = (
        <>
            {dataSourceDOM}
            {dataTransformationDOM}
        </>
    );

    const chartOptionsDOM = (
        <>
            <FormField stacked label="Type">
                <SimpleReactSelect
                    value={values.chartType}
                    onChange={(val) => {
                        setFieldValue('chartType', val);
                        // area defaults to true
                        if (val === 'area') {
                            setFieldValue('stack', true);
                        } else if (
                            [
                                'line',
                                'pie',
                                'doughnut',
                                'scatter',
                                'bubble',
                            ].includes(val)
                        ) {
                            // these charts cannot be stacked
                            setFieldValue('stack', false);
                            if (val === 'bubble' && !values.zIndex) {
                                setFieldValue('zIndex', 2);
                            }
                        }
                    }}
                    options={Object.entries(chartTypes).map(([key, val]) => ({
                        value: key,
                        label: val,
                    }))}
                />
            </FormField>
            {['bar', 'histogram'].includes(values.chartType) ? (
                <SimpleField type="checkbox" label="Stack Chart" name="stack" />
            ) : null}
        </>
    );

    let axesDOM: React.ReactChild = null;

    if (values.chartType !== 'table') {
        const noAxesConfig = ['pie', 'doughnut'].includes(values.chartType);
        const getAxisDOM = (
            prefix: string,
            axisMeta: IChartAxisMeta,
            scaleType: ChartScaleType,
            scaleOptions: ChartScaleType[] = ChartScaleOptions
        ) => {
            if (noAxesConfig) {
                return null;
            }

            const allScaleOptions = [
                {
                    label: `auto detect (${scaleType})`,
                    value: null,
                },
            ].concat(
                scaleOptions.map((value) => ({
                    label: value,
                    value,
                }))
            );

            let axisRangeDOM: React.ReactNode;
            const assumedScale = axisMeta.scale ?? scaleType;
            if (assumedScale === 'linear' || assumedScale === 'logarithmic') {
                axisRangeDOM = (
                    <FormField stacked label="Range">
                        <Level margin="8px">
                            <NumberField
                                name={`${prefix}.min`}
                                placeholder="Min"
                            />
                            <NumberField
                                name={`${prefix}.max`}
                                placeholder="Max"
                            />
                        </Level>
                    </FormField>
                );
            }

            return (
                <>
                    <SimpleField
                        stacked
                        type="react-select"
                        name={`${prefix}.scale`}
                        options={allScaleOptions}
                    />
                    {axisRangeDOM}
                </>
            );
        };

        const detectedXAxisScale = getAxesScaleType(values.xIndex);
        const xAxisDOM = (
            <>
                <FormSectionHeader>X Axis</FormSectionHeader>
                <FormField stacked label="X Axis">
                    <ReactSelectField
                        name={`xIndex`}
                        options={xAxisOptions}
                        isDisabled={!statementResultData}
                    />
                </FormField>
                {getAxisDOM(
                    'xAxis',
                    values.xAxis,
                    detectedXAxisScale === 'linear'
                        ? 'category'
                        : detectedXAxisScale,
                    chartTypeToAllowedAxisType[values.chartType].x
                )}
            </>
        );

        let yAxisDOM: React.ReactChild;
        if (!noAxesConfig) {
            const yAxisSeries = makeSeriesValsAndOptions(true);
            const defaultYAxisScaleType = yAxisSeries.length
                ? getAxesScaleType(yAxisSeries[0].value)
                : null;
            yAxisDOM = (
                <>
                    <FormSectionHeader>Y Axis</FormSectionHeader>
                    <FormField stacked label="Series">
                        <Select
                            styles={defaultReactSelectStyles}
                            value={yAxisSeries}
                            onChange={(val: any[]) =>
                                handleHiddenSeriesChange(val)
                            }
                            options={makeSeriesValsAndOptions(false)}
                            isMulti
                        />
                    </FormField>
                    {getAxisDOM(
                        'yAxis',
                        values.yAxis,
                        defaultYAxisScaleType,
                        chartTypeToAllowedAxisType[values.chartType].y
                    )}
                </>
            );
        }

        const zAxisDOM =
            values.chartType === 'bubble' ? (
                <>
                    <FormSectionHeader>Z Axis</FormSectionHeader>
                    <FormField stacked label="Z Axis">
                        <ReactSelectField
                            name={`zIndex`}
                            options={xAxisOptions}
                            isDisabled={!statementResultData}
                        />
                    </FormField>
                </>
            ) : null;

        axesDOM = (
            <>
                {xAxisDOM}
                {yAxisDOM}
                {zAxisDOM}
            </>
        );
    }

    const sortDOM = (
        <>
            <FormSectionHeader>Sort</FormSectionHeader>
            <SimpleField
                stacked
                type="react-select"
                options={xAxisOptions}
                name="sortIndex"
                label="Sort Index"
                withDeselect
                onChange={(val) => {
                    setFieldValue('sortIndex', val);
                    if (val != null) {
                        setTableTab('transformed');
                    }
                }}
            />
            <SimpleField
                stacked
                type="react-select"
                options={[
                    { value: true, label: 'Ascending' },
                    { value: false, label: 'Descending' },
                ]}
                name="sortAsc"
                label="Sort Direction"
            />
        </>
    );

    const chartTabDOM = (
        <>
            {chartOptionsDOM}
            {axesDOM}
            {sortDOM}
        </>
    );

    const seriesColorDOM = chartData
        ? chartData[0].map((col, seriesIdx) => {
              if (seriesIdx === 0 || values.hiddenSeries.includes(seriesIdx)) {
                  return null;
              }
              const colorIdx =
                  seriesIdx in values.coloredSeries
                      ? values.coloredSeries[seriesIdx]
                      : seriesIdx % colorPalette.length;
              return (
                  <FormField
                      stacked
                      key={col}
                      label={() => (
                          <>
                              <b>{col}</b> Color
                          </>
                      )}
                  >
                      <ReactSelectField
                          value={colorIdx}
                          name={`coloredSeries[${seriesIdx}]`}
                          options={seriesColorOptions}
                      />
                  </FormField>
              );
          })
        : null;

    const visualsTabDOM =
        values.chartType === 'table' ? (
            <FormField stacked label="Title">
                <Field name="title" />
            </FormField>
        ) : (
            <>
                <FormField stacked label="Title">
                    <Field name="title" />
                </FormField>
                {['pie', 'doughnut'].includes(values.chartType) ? null : (
                    <>
                        <SimpleField
                            stacked
                            label="X Axis Label"
                            name="xAxis.label"
                            type="input"
                        />
                        <SimpleField
                            stacked
                            label="Y Axis Label"
                            name="yAxis.label"
                            type="input"
                        />
                    </>
                )}
                <FormSectionHeader>Legend</FormSectionHeader>
                <SimpleField
                    label="Visible"
                    name="legendDisplay"
                    type="checkbox"
                />
                <SimpleField
                    stacked
                    label="Position"
                    name="legendPosition"
                    type="react-select"
                    options={['top', 'bottom', 'left', 'right']}
                />

                <FormSectionHeader>Values</FormSectionHeader>
                <SimpleField
                    stacked
                    label="Display"
                    name="valueDisplay"
                    type="react-select"
                    options={[
                        {
                            value: chartValueDisplayType.FALSE,
                            label: 'Hide Values',
                        },
                        {
                            value: chartValueDisplayType.TRUE,
                            label: 'Show Values',
                        },
                        {
                            value: chartValueDisplayType.AUTO,
                            label: 'Show Values without Overlap',
                        },
                    ]}
                    onChange={(val) => {
                        setFieldValue('valueDisplay', val);
                        if (val) {
                            if (values.valuePosition == null) {
                                setFieldValue('valuePosition', 'center');
                            }
                            if (values.valueAlignment == null) {
                                setFieldValue('valueAlignment', 'center');
                            }
                        }
                    }}
                />
                {values.valueDisplay ? (
                    <>
                        <SimpleField
                            stacked
                            label="Position"
                            name="valuePosition"
                            type="react-select"
                            options={['center', 'start', 'end']}
                        />
                        <SimpleField
                            stacked
                            label="Alignment"
                            name="valueAlignment"
                            type="react-select"
                            options={[
                                'center',
                                'start',
                                'end',
                                'right',
                                'left',
                                'top',
                                'bottom',
                            ]}
                        />
                    </>
                ) : null}
                {['pie', 'doughnut', 'table'].includes(
                    values.chartType
                ) ? null : (
                    <>
                        <FormSectionHeader>Colors</FormSectionHeader>
                        {seriesColorDOM}
                    </>
                )}
                {['line', 'area'].includes(values.chartType) ? (
                    <>
                        <FormSectionHeader>Line Formatting</FormSectionHeader>
                        <SimpleField
                            label="Connect missing data"
                            name="connectMissing"
                            type="checkbox"
                        />
                    </>
                ) : null}
            </>
        );

    const formDOM = (
        <FormWrapper size={7} className="DataDocChartComposer-form">
            <DisabledSection disabled={!isEditable}>
                {formTab === 'data' && dataTabDOM}
                {formTab === 'chart' && chartTabDOM}
                {formTab === 'visuals' && visualsTabDOM}
            </DisabledSection>
        </FormWrapper>
    );

    const hideTableButtonDOM = (
        <IconButton
            icon={showTable ? 'chevron-down' : 'chevron-up'}
            onClick={() => setShowTable(!showTable)}
            noPadding
        />
    );

    let dataDOM: JSX.Element;
    let dataSwitch: JSX.Element;
    if (chartData && showTable) {
        if (values.aggregate || values.switch || values.sortIndex != null) {
            dataSwitch = (
                <div className="toggleTableDataSwitch">
                    <Tabs
                        selectedTabKey={tableTab}
                        onSelect={(key: 'original' | 'transformed') =>
                            setTableTab(key)
                        }
                        items={tableTabs}
                    />
                </div>
            );
        }

        dataDOM = (
            <div className="DataDocChartComposer-data">
                <StatementResultTable
                    data={
                        tableTab === 'original'
                            ? statementResultData
                            : chartData
                    }
                    paginate={true}
                    maxNumberOfRowsToShow={5}
                />
            </div>
        );
    }

    const tableDOM = (
        <div className="DataDocChartComposer-bottom">
            <Level>
                <LevelItem>{dataSwitch}</LevelItem>
                <LevelItem>{hideTableButtonDOM}</LevelItem>
            </Level>
            {dataDOM}
        </div>
    );

    const renderPickerDOM = () => {
        if (values.sourceType === 'custom') {
            return null; // Custom data is sourced from internal context
        }

        const queryExecutionPicker =
            values.sourceType !== 'execution' && queryExecutions.length ? (
                <QueryExecutionPicker
                    queryExecutionId={displayExecutionId}
                    onSelection={setDisplayExecutionId}
                    queryExecutions={queryExecutions}
                    autoSelect
                />
            ) : null;

        const statementExecutionPicker =
            displayExecutionId != null && statementExecutions.length ? (
                <StatementExecutionPicker
                    statementExecutionId={displayStatementId}
                    onSelection={setDisplayStatementId}
                    statementExecutions={statementExecutions}
                    total={statementExecutions.length}
                    autoSelect
                />
            ) : null;

        return (
            <div className="DataDocChartComposer-exec-picker">
                <div>{queryExecutionPicker}</div>
                <div>{statementExecutionPicker}</div>
            </div>
        );
    };

    const chartDOM =
        values.chartType === 'table' ? (
            <DataDocChartCellTable data={chartData} title={values.title} />
        ) : (
            <DataDocChart
                data={chartData}
                meta={formValsToMeta(values, meta)}
                chartJSOptions={{ maintainAspectRatio: false }}
            />
        );

    const makeLeftDOM = () => (
        <div className="DataDocChartComposer-left">
            <div className="DataDocChartComposer-chart">
                {renderPickerDOM()}
                <div className="DataDocChartComposer-chart-sizer">
                    <ErrorBoundary>{chartData ? chartDOM : null}</ErrorBoundary>
                </div>
            </div>
            {tableDOM}
        </div>
    );

    return (
        <div className="DataDocChartComposer">
            <div className="DataDocChartComposer-content">
                {makeLeftDOM()}
                <div className="DataDocChartComposer-right">
                    {tabsDOM}
                    {formDOM}
                    {isEditable ? (
                        <div className="DataDocChartComposer-button">
                            <SoftButton
                                onClick={() => handleSubmit()}
                                title="Submit"
                                fullWidth
                                pushable={false}
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

function formValsToMeta(vals: IChartFormValues, meta: IDataChartCellMeta) {
    const updatedMeta = produce(meta, (draft) => {
        // data source
        draft.data.source_type = vals.sourceType;
        if (vals.sourceType === 'cell') {
            draft.data.source_ids = [vals.cellId];
        } else if (vals.sourceType === 'execution') {
            draft.data.source_ids = [vals.executionId];
        }

        // data transformation
        if (
            vals.formatAggCol ||
            vals.formatSeriesCol ||
            vals.formatValueCols.length
        ) {
            draft.data.transformations.format = {
                agg_col: vals.formatAggCol,
                series_col: vals.formatSeriesCol,
                value_cols: vals.formatValueCols,
            };
        } else {
            draft.data.transformations.format = {};
        }
        draft.data.transformations.aggregate = vals.aggregate;
        draft.data.transformations.switch = vals.switch;

        // X Axes
        draft.chart.x_axis.col_idx = vals.xIndex;
        for (const [field, val] of Object.entries(vals.xAxis)) {
            if (val != null) {
                draft.chart.x_axis[field] = val;
            } else {
                delete draft.chart.x_axis[field];
            }
        }
        if (vals.sortIndex != null) {
            draft.chart.x_axis.sort = {
                idx: vals.sortIndex,
                asc: vals.sortAsc,
            };
        }

        // Y Axes
        for (const [field, val] of Object.entries(vals.yAxis)) {
            if (val != null) {
                draft.chart.y_axis[field] = val;
            } else {
                delete draft.chart.y_axis[field];
            }
        }
        draft.chart.y_axis.stack = vals.stack;

        // Z Axes
        if (vals.chartType === 'bubble') {
            draft.chart.z_axis = { col_idx: vals.zIndex ?? 2 };
        }

        const seriesObj = {};
        if (vals.hiddenSeries.length) {
            for (const series of vals.hiddenSeries) {
                seriesObj[series] = {
                    hidden: true,
                };
            }
        }
        if (!isEmpty(vals.coloredSeries)) {
            for (const [series, color] of Object.entries(vals.coloredSeries)) {
                seriesObj[series] = {
                    ...(seriesObj[series] || {}),
                    color,
                };
            }
        }
        if (!isEmpty(vals.aggSeries)) {
            for (const [series, type] of Object.entries(vals.aggSeries)) {
                seriesObj[series] = {
                    ...(seriesObj[series] || {}),
                    agg_type: type,
                };
            }
        }
        draft.chart.y_axis.series = seriesObj;

        // chart
        draft.chart.type = vals.chartType;

        // labels
        draft.title = vals.title;
        draft.visual.legend_position = vals.legendPosition;
        draft.visual.legend_display = vals.legendDisplay;
        draft.visual.connect_missing = vals.connectMissing;

        draft.visual.values = {
            display: vals.valueDisplay ?? chartValueDisplayType.FALSE,
            position: vals.valuePosition,
            alignment: vals.valueAlignment,
        };
    });
    return updatedMeta;
}

export const DataDocChartComposer = withFormik<IProps, IChartFormValues>({
    mapPropsToValues: ({ meta, cellAboveId }) =>
        mapMetaToFormVals(meta, cellAboveId),

    handleSubmit: (values, { props: { onUpdateChartConfig, meta } }) => {
        onUpdateChartConfig(formValsToMeta(values, meta));
    },
})(DataDocChartComposerComponent);
