import {
    ChartOptions,
    LineControllerDatasetOptions,
    TimeScaleOptions,
    ScaleOptions,
    LinearScaleOptions,
} from 'chart.js';

import { IDataChartCellMeta } from 'const/datadoc';
import {
    ChartDataAggType,
    IChartAxisMeta,
    IChartFormValues,
    ChartScaleType,
    ChartValueDisplayType,
    ChartSize,
} from 'const/dataDocChart';
import { fontColor, fillColor, backgroundColor } from 'const/chartColors';
import type { DeepPartial } from 'lib/typescript';
import { formatNumber } from 'lib/utils/number';

function filterSeries<T, K extends keyof T>(
    series: Record<number, T>,
    filterBy: K
) {
    const obj: Record<number, T[K]> = {};
    for (const key in series) {
        if (series[key][filterBy] != null) {
            obj[key] = series[key][filterBy];
        }
    }
    return obj;
}

function rgb(rgbArr: number[]) {
    const prefix = rgbArr.length <= 3 ? 'rgb' : 'rgba';
    const content = rgbArr.map(String).join(', ');
    return `${prefix}(${content})`;
}

export function getDataTransformationOptions(meta: IDataChartCellMeta) {
    const { transformations } = meta.data;
    const aggregate = Boolean(transformations.aggregate);
    const aggSeries = filterSeries(meta.chart.y_axis.series, 'agg_type');

    let aggType: ChartDataAggType = 'sum';
    let formatAggCol: number;
    let formatSeriesCol: number;
    let formatValueCols: number[] = [];

    if (aggregate) {
        formatAggCol = transformations.format.agg_col;
        if (formatAggCol < 0) {
            // legacy code can make it -1
            formatAggCol = undefined;
        }
        formatSeriesCol = transformations.format.series_col;
        formatValueCols = transformations.format.value_cols;

        const aggTypeArr = Object.values(aggSeries);
        if (aggTypeArr.length) {
            aggType = aggTypeArr.every((type) => aggTypeArr[0] === type)
                ? aggTypeArr[0]
                : undefined;
        }
    }

    return {
        formatAggCol,
        formatSeriesCol,
        formatValueCols,
        aggregate,

        switch: Boolean(transformations.switch),
        aggSeries,
        aggType,
        sortIndex: meta.chart.x_axis.sort?.idx,
        sortAsc: meta.chart.x_axis.sort?.asc ?? true,
        xAxisIdx: meta.chart.x_axis.col_idx,
    };
}

export function getAxisOptions(axisMeta: IChartAxisMeta) {
    return {
        label: axisMeta.label ?? '',
        scale: axisMeta.scale,
        min: axisMeta.min,
        max: axisMeta.max,
    };
}

export function mapMetaToFormVals(
    meta: IDataChartCellMeta,
    cellAboveId: number
): IChartFormValues {
    const cellId =
        meta.data.source_type === 'cell_above'
            ? cellAboveId
            : meta.data.source_type === 'cell'
            ? meta.data.source_ids[0]
            : undefined;

    const executionId =
        meta.data.source_type === 'execution'
            ? meta.data.source_ids[0]
            : undefined;
    const hiddenSeries = Object.entries(meta.chart.y_axis.series || {})
        .filter(([_, val]) => val.hidden)
        .map(([idx, _]) => Number(idx));

    return {
        // data source
        sourceType: meta.data.source_type,
        cellId,
        executionId,

        // data transformation
        ...getDataTransformationOptions(meta),

        // axes
        xAxis: getAxisOptions(meta.chart.x_axis),
        xIndex: meta.chart.x_axis.col_idx,
        sortIndex: meta.chart.x_axis.sort?.idx,
        sortAsc: meta.chart.x_axis.sort?.asc ?? true,

        yAxis: getAxisOptions(meta.chart.y_axis),
        stack: Boolean(meta.chart.y_axis.stack),

        zIndex: meta.chart.z_axis?.col_idx,

        hiddenSeries,
        coloredSeries: filterSeries(meta.chart.y_axis.series, 'color'),
        // chart
        chartType: meta.chart.type,

        // labels
        title: meta.title || '',
        legendPosition: meta.visual.legend_position ?? 'top',
        legendDisplay: meta.visual.legend_display ?? true,
        connectMissing: meta.visual.connect_missing ?? false,
        size: meta.visual.size ?? ChartSize.AUTO,

        valueDisplay:
            meta.visual.values?.display ?? ChartValueDisplayType.FALSE,
        valuePosition: meta.visual.values?.position,
        valueAlignment: meta.visual.values?.alignment,
    };
}

export function mapMetaToChartOptions(
    meta: IDataChartCellMeta,
    theme: string,
    xAxesScaleType: ChartScaleType,
    yAxesScaleType: ChartScaleType
): ChartOptions {
    const optionsObj: ChartOptions = {
        responsive: true,

        interaction: {
            mode: 'index',
            intersect: true,
        },
        plugins: {
            legend: {
                position: meta.visual.legend_position ?? 'top',
                display: meta.visual.legend_display ?? true,
            },
            title: {
                display: !!meta.title.length,
                text: meta.title,
                font: {
                    family: 'Poppins',
                    weight: 'bold',
                    size: 16,
                },
            },
            tooltip: {
                position: 'nearest',
                backgroundColor: backgroundColor[theme],

                bodyColor: rgb(fontColor[theme]),
                titleColor: rgb(fontColor[theme]),
                bodySpacing: 8,
                multiKeyBackground: fillColor[theme],
                padding: 8,
                caretSize: 8,
                cornerRadius: 4,
                bodyFont: {
                    weight: '500',
                },
                titleMarginBottom: 8,
            },
            datalabels: {
                display:
                    meta.visual.values?.display === ChartValueDisplayType.TRUE
                        ? true
                        : meta.visual.values?.display ===
                          ChartValueDisplayType.AUTO
                        ? 'auto'
                        : false,
                anchor: meta.visual.values?.position,
                align: meta.visual.values?.alignment,
            },
        },
        animation: {
            duration: 0,
        },

        elements: {
            point: {
                radius: 0,
                hitRadius: 3,
                hoverRadius: 3,
                hoverBorderWidth: 5,
            },
        },
    };

    // If auto size, then let aspect ratio be auto maintained, otherwise
    // fit the content to the height, so no need to maintain ratio
    const chartSize = meta.visual?.size ?? ChartSize.AUTO;
    if (chartSize !== ChartSize.AUTO) {
        optionsObj.maintainAspectRatio = false;
    }

    if (meta.visual.connect_missing != null) {
        (optionsObj as LineControllerDatasetOptions).spanGaps =
            meta.visual.connect_missing;
    }

    // Tooltip
    if (meta.chart.type === 'pie' || meta.chart.type === 'doughnut') {
        optionsObj.plugins.tooltip.callbacks = {
            label: (context) => {
                const label = context.dataset.label;
                const currentValue = context.parsed;
                const percentage = (
                    ((context.element as any).circumference * 100) /
                    (2 * Math.PI)
                ).toFixed(1);
                return `${label}: ${formatNumber(
                    currentValue
                )} (${percentage}%)`;
            },
            title: (titleContext) => titleContext[0].label,
        };
    } else {
        const invertAxis = meta.chart.type === 'histogram';
        optionsObj.plugins.tooltip.callbacks = {
            label: (context) => {
                const label = context.dataset.label ?? '';
                const value = invertAxis ? context.parsed.x : context.parsed.y;
                return ` ${label}: ${formatNumber(value)}`;
            },
            title: (titleContext): string => {
                if (meta.chart.y_axis.stack) {
                    let totalValue = 0;
                    for (const metricContext of titleContext) {
                        totalValue += Number(
                            invertAxis
                                ? metricContext.parsed.x
                                : metricContext.parsed.y
                        );
                    }
                    if (!isNaN(totalValue)) {
                        return (
                            String(titleContext[0].label) +
                            ' Total: ' +
                            formatNumber(totalValue)
                        );
                    }
                }
                return String(titleContext[0].label);
            },
        };

        let xAxesOptions = computeScaleOptions(
            xAxesScaleType,
            meta.chart.x_axis,
            theme,
            meta.chart.y_axis.stack,
            true
        );
        let yAxesOptions = computeScaleOptions(
            yAxesScaleType,
            meta.chart.y_axis,
            theme,
            meta.chart.y_axis.stack
        );

        if (invertAxis) {
            optionsObj.indexAxis = 'y';
            [xAxesOptions, yAxesOptions] = [yAxesOptions, xAxesOptions];
        }

        optionsObj.scales = {
            x: xAxesOptions,
            y: yAxesOptions,
        };
    }

    if (meta.chart.type === 'scatter') {
        optionsObj.elements.point.radius = 4;
    }

    return optionsObj;
}

function computeScaleOptions(
    scaleType: ChartScaleType,
    axisMeta: IChartAxisMeta,
    theme: string,
    stack: boolean,
    isXAxis = false
): ScaleOptions {
    // Known bug: if scale type change from log to time, the graph crash
    // I think it is a chart js issue
    const axis: ScaleOptions = {
        grid: {
            display: true,
            color: rgb(fontColor[theme].concat([0.25])),
        },
        title: {
            display: !!axisMeta.label.length,
            text: axisMeta.label,
        },
        stacked: stack,
    };

    if (scaleType != null) {
        axis.type = scaleType;
    }

    if (scaleType === 'time') {
        (axis as DeepPartial<TimeScaleOptions>).time = {
            tooltipFormat: 'll HH:mm',
            displayFormats: {
                day: 'MM/DD',
                hour: 'MM/DD hA',
                minute: 'h:mm a',
            },
        };
    } else if (scaleType === 'linear' || scaleType === 'logarithmic') {
        // for empty case, it might be null or ""
        if (axisMeta.max != null && typeof axisMeta.max === 'number') {
            axis.max = axisMeta.max;
        }
        if (axisMeta.min != null && typeof axisMeta.min === 'number') {
            axis.min = axisMeta.min;
        } else if (!isXAxis) {
            // for yAxis, make sure 0 is shown unless specificed
            (axis as LinearScaleOptions).beginAtZero = true;
        }

        // Prevent ticks from erroring out if there is no data provided
        // See https://github.com/chartjs/Chart.js/issues/8092
        axis.ticks = {
            callback: (val) => val,
        };
    }

    return axis;
}
