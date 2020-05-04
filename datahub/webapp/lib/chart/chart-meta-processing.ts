import moment from 'moment';
import { ChartOptions, CommonAxe } from 'chart.js';

import { IDataChartCellMeta } from 'const/datadoc';
import {
    ChartDataAggType,
    IChartAxisMeta,
    IChartFormValues,
    ChartScaleType,
    ChartType,
} from 'const/dataDocChart';
import { fontColor, fillColor, backgroundColor } from 'const/chartColors';
import { formatNumber } from './chart-utils';

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
        formatAggCol = transformations.format?.agg_col ?? 0;
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

        hiddenSeries,
        coloredSeries: filterSeries(meta.chart.y_axis.series, 'color'),
        // chart
        chartType: meta.chart.type,

        // labels
        title: meta.title || '',
        legendPosition: meta.visual.legend_position || 'top',
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
        legend: {
            position: meta.visual.legend_position || 'top',
        },
        animation: {
            duration: 0,
        },
        title: {
            display: !!meta.title.length,
            text: meta.title,
            fontSize: 16,
        },
        tooltips: {
            mode: 'index',
            position: 'nearest',
            backgroundColor: backgroundColor[theme],
            bodyFontColor: rgb(fontColor[theme]),
            titleFontColor: rgb(fontColor[theme]),
            bodySpacing: 8,
            multiKeyBackground: fillColor[theme],
            xPadding: 8,
            yPadding: 8,
            caretSize: 8,
            cornerRadius: 4,
            bodyFontStyle: '500',
            titleMarginBottom: 8,
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

    if (meta.chart.type === 'pie' || meta.chart.type === 'doughnut') {
        optionsObj.tooltips['callbacks'] = {
            label: (tooltipItem, chartData) => {
                const dataset = chartData.datasets[tooltipItem.datasetIndex];
                const totalValue =
                    dataset._meta[Object.keys(dataset._meta)[0]].total;
                const currentValue = dataset.data[tooltipItem.index] as number;
                const percentage = parseFloat(
                    ((currentValue / totalValue) * 100).toFixed(1)
                );
                return `${dataset.label}: ${formatNumber(
                    currentValue
                )} (${percentage}%)`;
            },
            title: (tooltipItem, chartData) => {
                return chartData.labels[tooltipItem[0].index];
            },
        };
    } else {
        optionsObj.tooltips['callbacks'] = {
            label: (tooltipItem, chartData) => {
                const label =
                    chartData.datasets[tooltipItem.datasetIndex].label || '';
                const value = tooltipItem.value;
                return ` ${label}: ${formatNumber(value)}`;
            },
            title: (tooltipItem, chartData) => {
                if (meta.chart.y_axis.stack) {
                    let totalValue = 0;
                    for (const value of tooltipItem) {
                        totalValue += Number(value.yLabel);
                    }
                    if (isNaN(totalValue)) {
                        return chartData.labels[tooltipItem[0].index];
                    } else {
                        return (
                            chartData.labels[tooltipItem[0].index] +
                            ' Total: ' +
                            formatNumber(totalValue)
                        );
                    }
                } else {
                    return chartData.labels[tooltipItem[0].index];
                }
            },
        };
        let xAxesOptions = computeScaleOptions(
            xAxesScaleType,
            meta.chart.x_axis,
            theme,
            meta.chart.y_axis.stack,
            meta.chart.type
        );
        let yAxesOptions = computeScaleOptions(
            yAxesScaleType,
            meta.chart.y_axis,
            theme,
            meta.chart.y_axis.stack,
            meta.chart.type
        );

        // Because histogram is horizontal bar
        // We need to reverse the x, y axes settings
        if (meta.chart.type === 'histogram') {
            [xAxesOptions, yAxesOptions] = [yAxesOptions, xAxesOptions];
        }

        optionsObj['scales'] = {
            xAxes: [xAxesOptions],
            yAxes: [yAxesOptions],
        };
    }

    return optionsObj;
}

function computeScaleOptions(
    scaleType: ChartScaleType,
    axisMeta: IChartAxisMeta,
    theme: string,
    stack: boolean,
    chartType: ChartType
): CommonAxe {
    // Known bug: if scale type change from log to time, the graph crash
    // I think it is a chart js issue

    const axis: CommonAxe = {
        gridLines: {
            display: true,
            color: rgb(fontColor[theme].concat([0.25])),
        },
        scaleLabel: {
            display: !!axisMeta.label.length,
            labelString: axisMeta.label,
        },
        stacked: stack,
    };

    if (scaleType != null) {
        axis.type = scaleType;
    }

    if (scaleType === 'time') {
        axis.time = {
            tooltipFormat: 'll HH:mm',
            displayFormats: {
                day: 'MM/DD',
                hour: 'MM/DD hA',
                minute: 'h:mm a',
            },
            // unit: 'day',
        };

        if (['scatter', 'bubble'].includes(chartType)) {
            axis.ticks = {
                ...axis.ticks,
                callback: (label) => {
                    return moment(label).format('MM/DD');
                },
            };
        }
    } else if (scaleType === 'linear' || scaleType === 'logarithmic') {
        // for empty case, it might be null or ""
        if (axisMeta.max != null && typeof axisMeta.max === 'number') {
            axis.ticks = {
                ...axis.ticks,
                max: axisMeta.max,
            };
        }
        if (axisMeta.min != null && typeof axisMeta.min === 'number') {
            axis.ticks = {
                ...axis.ticks,
                min: axisMeta.min,
            };
        } else {
            // default min to 0 unless specified
            axis.ticks = {
                ...axis.ticks,
                min: 0,
            };
        }
    }

    return axis;
}
