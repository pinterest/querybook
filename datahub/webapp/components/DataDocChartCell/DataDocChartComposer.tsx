import * as React from 'react';
import { useSelector } from 'react-redux';

import { Field, withFormik, FormikProps } from 'formik';
import produce from 'immer';
import { isEmpty, range } from 'lodash';
import Select from 'react-select';

import { IStoreState } from 'redux/store/types';
import { IDataQueryCellMeta, IDataChartCellMeta } from 'const/datadoc';
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
} from 'const/dataDocChart';
import { colorPalette, colorPaletteNames } from 'const/chartColors';

import { defaultReactSelectStyles } from 'lib/utils/react-select';
import { mapMetaToFormVals } from 'lib/chart/chart-meta-processing';
import { transformData } from 'lib/chart/chart-data-transformation';
import { useChartSource } from 'hooks/chart/useChartSource';

import { DataDocChart } from './DataDocChart';
import { QueryExecutionPicker } from 'components/ExecutionPicker/QueryExecutionPicker';
import { StatementExecutionPicker } from 'components/ExecutionPicker/StatementExecutionPicker';
import { StatementResultTable } from 'components/DataDocStatementExecution/StatementResultTable';

import { Button } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { ErrorBoundary } from 'ui/ErrorBoundary/ErrorBoundary';
import { Checkbox } from 'ui/Form/Checkbox';
import { FormField, FormSectionHeader } from 'ui/Form/FormField';
import { Tabs } from 'ui/Tabs/Tabs';

import './DataDocChartComposer.scss';
import { Level, LevelItem } from 'ui/Level/Level';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';
import { getDefaultScaleType } from 'lib/chart/chart-utils';
import { NumberField } from 'ui/FormikField/NumberField';
import { CheckboxField } from 'ui/FormikField/CheckboxField';
import { ReactSelectField } from 'ui/FormikField/ReactSelectField';
import { FormWrapper } from 'ui/Form/FormWrapper';
import { SimpleField } from 'ui/FormikField/SimpleField';

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

    const chartData = React.useMemo(() => {
        return statementResultData
            ? transformData(
                  statementResultData,
                  values.aggregate,
                  values.switch,
                  values.formatAggCol,
                  values.formatSeriesCol,
                  values.formatValueCols,
                  values.aggSeries
              )
            : null;
    }, [
        statementResultData,
        values.aggregate,
        values.switch,
        values.formatAggCol,
        values.formatSeriesCol,
        values.formatValueCols,
        values.aggType,
        values.aggSeries,
    ]);

    // getting redux state
    const queryCellOptions = useSelector((state: IStoreState) => {
        const cellList = state.dataDoc.dataDocById[dataDocId].cells;
        return cellList
            .filter(
                (id) => state.dataDoc.dataDocCellById[id].cell_type === 'query'
            )

            .map((id, idx) => {
                const cellMeta: IDataQueryCellMeta =
                    state.dataDoc.dataDocCellById[id].meta;
                const title = cellMeta.title || `Query #${idx + 1}`;
                return {
                    id,
                    title,
                };
            });
    });

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
        const options = statementResultData[0].map((label, idx) => ({
            value: idx,
            label,
        }));
        options.unshift({
            value: -1,
            label: 'All Rows',
        });
        return options;
    }, [statementResultData, values.formatAggCol]);

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
                        values.coloredSeries[i] || i % colorPalette.length
                    ],
            }));

            return options;
        },
        [
            chartData,
            statementResultData,
            values.xIndex,
            values.hiddenSeries,
            values.coloredSeries,
            values.aggregate,
            values.switch,
        ]
    );

    const getAxesScaleType = React.useCallback(
        (colIndex: number) => getDefaultScaleType(chartData?.[1]?.[colIndex]),
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
        for (let i = 0; i < statementResultData[0].length; i++) {
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
            <FormField label="Transformation">
                <Checkbox
                    value={values.aggregate}
                    title="Aggregate Data"
                    onChange={(val) => {
                        setFieldValue('aggregate', val);
                        setFieldValue('hiddenSeries', []);
                        if (val) {
                            handleAggTypeChange('sum');
                            setTableTab('transformed');
                            setFieldValue('formatAggCol', 0);
                            setFieldValue('formatSeriesCol', 1);
                            setFieldValue('formatValueCols', [2]);
                        } else {
                            setFieldValue('aggType', undefined);
                            setFieldValue('aggSeries', {});
                        }
                    }}
                />
            </FormField>
            {values.aggregate ? (
                <>
                    <SimpleField
                        stacked
                        type="react-select"
                        label="Group Rows By"
                        name="formatAggCol"
                        options={formatAggByOptions}
                        isDisabled={!statementResultData}
                    />

                    {values.formatAggCol === -1 ? null : (
                        <>
                            <SimpleField
                                stacked
                                label="Group Columns By"
                                type="react-select"
                                name="formatSeriesCol"
                                options={makeFormatSeriesOptions}
                                isDisabled={!statementResultData}
                            />

                            <FormField stacked label="Value">
                                <SimpleReactSelect
                                    value={
                                        statementResultData &&
                                        values.formatValueCols?.[0]
                                    }
                                    onChange={(val) => {
                                        setFieldValue('formatValueCols', [val]);
                                    }}
                                    options={makeFormatValueOptions}
                                />
                            </FormField>
                        </>
                    )}
                    <FormField stacked label="Value Aggregation Type">
                        <SimpleReactSelect
                            value={values.aggType}
                            onChange={(val) => handleAggTypeChange(val)}
                            options={seriesAggOptions}
                        />
                    </FormField>
                    {/* <FormField> 
                            <Checkbox
                                value={showSeriesAggTypes}
                                title="Select Aggregation Type by Series"
                                onChange={val => setShowSeriesAggTypes(val)}
                            /> 
                    </FormField>
                    {showSeriesAggTypes
                        ? ['pie', 'doughnut'].includes(values.chartType)
                            ? null
                            : seriesAggTypeDOM
                        : null} */}
                </>
            ) : null}
            <SimpleField
                type="checkbox"
                label="Switch Rows/Columns"
                name="switch"
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
                        }
                    }}
                    options={Object.entries(chartTypes).map(([key, val]) => ({
                        value: key,
                        label: val,
                    }))}
                />
            </FormField>

            {['area', 'bar', 'histogram'].includes(values.chartType) ? (
                <SimpleField
                    type="checkbox"
                    label="Stack Chart"
                    name="stack"
                    disabled={values.chartType === 'area'}
                />
            ) : null}
        </>
    );

    let axesDOM: React.ReactChild = null;

    if (values.chartType !== 'table') {
        const noAxesConfig = ['pie', 'doughnut'].includes(values.chartType);
        const getAxisDOM = (
            prefix: string,
            axisMeta: IChartAxisMeta,
            scaleType: ChartScaleType
        ) => {
            if (noAxesConfig) {
                return null;
            }

            const scaleOptions = [
                {
                    label: `auto detect (${scaleType})`,
                    value: null,
                },
            ].concat(
                ['time', 'category', 'linear', 'logarithmic'].map((value) => ({
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
                        options={scaleOptions}
                    />
                    {axisRangeDOM}
                </>
            );
        };

        const xAxisDOM = (
            <>
                <FormSectionHeader>X Axis</FormSectionHeader>
                <FormField stacked label="Series">
                    <ReactSelectField
                        name={`xIndex`}
                        options={xAxisOptions}
                        isDisabled={!statementResultData}
                    />
                </FormField>
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
                    {getAxisDOM('yAxis', values.yAxis, defaultYAxisScaleType)}
                </>
            );
        }

        axesDOM = (
            <>
                {xAxisDOM}
                {yAxisDOM}
            </>
        );
    }

    const chartTabDOM = (
        <>
            {chartOptionsDOM}
            {axesDOM}
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
                      : seriesIdx;
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
        values.chartType === 'table' ? null : (
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
                <SimpleField
                    stacked
                    label="Legend Position"
                    name="legendPosition"
                    type="react-select"
                    options={['top', 'bottom', 'left', 'right'].map(
                        (option) => ({
                            value: option,
                            label: option,
                        })
                    )}
                />

                {['pie', 'doughnut', 'table'].includes(
                    values.chartType
                ) ? null : (
                    <>
                        <FormSectionHeader>Colors</FormSectionHeader>
                        {seriesColorDOM}
                    </>
                )}
            </>
        );

    const formDOM = (
        <FormWrapper size={7} className="DataDocChartComposer-form">
            <fieldset disabled={!isEditable}>
                {formTab === 'data' && dataTabDOM}
                {formTab === 'chart' && chartTabDOM}
                {formTab === 'visuals' && visualsTabDOM}
            </fieldset>
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
        if (values.aggregate || values.switch) {
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
            <StatementResultTable
                data={chartData}
                paginate={true}
                maxNumberOfRowsToShow={20}
            />
        ) : (
            <DataDocChart
                data={chartData}
                meta={formValsToMeta(values, meta)}
                chartJsOptionObj={{ maintainAspectRatio: false }}
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
                            <Button
                                onClick={() => handleSubmit()}
                                title="Submit"
                                type="fullWidth"
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
            draft.chart.x_axis[field] = val;
        }
        draft.chart.y_axis.stack = vals.stack;

        // Y Axes
        for (const [field, val] of Object.entries(vals.yAxis)) {
            draft.chart.y_axis[field] = val;
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
    });
    return updatedMeta;
}

export const DataDocChartComposer = withFormik<IProps, IChartFormValues>({
    mapPropsToValues: ({ meta, cellAboveId }) => {
        return mapMetaToFormVals(meta, cellAboveId);
    },

    handleSubmit: (values, { props: { onUpdateChartConfig, meta } }) => {
        onUpdateChartConfig(formValsToMeta(values, meta));
    },
})(DataDocChartComposerComponent);
