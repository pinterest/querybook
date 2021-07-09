import { ChartOptions, CommonAxe } from 'chart.js';

import { IDataChartCellMeta } from 'const/datadoc';
import {
    ChartDataAggType,
    IChartAxisMeta,
    IChartFormValues,
    ChartScaleType,
    chartValueDisplayType,
} from 'const/dataDocChart';
import { fontColor, fillColor, backgroundColor } from 'const/chartColors';
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

        valueDisplay:
            meta.visual.values?.display ?? chartValueDisplayType.FALSE,
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
        legend: {
            position: meta.visual.legend_position ?? 'top',
            display: meta.visual.legend_display ?? true,
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

    if (meta.visual.connect_missing != null) {
        optionsObj.spanGaps = meta.visual.connect_missing;
    }

    optionsObj['plugins'] = {
        datalabels: {
            display:
                meta.visual.values?.display === chartValueDisplayType.TRUE
                    ? true
                    : meta.visual.values?.display === chartValueDisplayType.AUTO
                    ? 'auto'
                    : false,
            anchor: meta.visual.values?.position,
            align: meta.visual.values?.alignment,
        },
    };

    if (meta.chart.type === 'pie' || meta.chart.type === 'doughnut') {
        optionsObj.tooltips['callbacks'] = {
            label: (tooltipItem, chartData) => {
                const dataset = chartData.datasets[tooltipItem.datasetIndex];
                const datasetMeta: Record<
                    number,
                    { total: number }
                > = (dataset as any)._meta;
                const totalValue =
                    datasetMeta[Object.keys(datasetMeta)[0]].total;

                const currentValue = dataset.data[tooltipItem.index] as number;
                const percentage = parseFloat(
                    ((currentValue / totalValue) * 100).toFixed(1)
                );
                return `${dataset.label}: ${formatNumber(
                    currentValue
                )} (${percentage}%)`;
            },
            title: (tooltipItem, chartData) =>
                String(chartData.labels[tooltipItem[0].index]),
        };
    } else {
        optionsObj.tooltips['callbacks'] = {
            label: (tooltipItem, chartData) => {
                const label =
                    chartData.datasets[tooltipItem.datasetIndex].label || '';
                const value = tooltipItem.value;
                return ` ${label}: ${formatNumber(value)}`;
            },
            title: (tooltipItem, chartData): string => {
                if (meta.chart.y_axis.stack) {
                    let totalValue = 0;
                    for (const value of tooltipItem) {
                        totalValue += Number(value.yLabel);
                    }
                    if (isNaN(totalValue)) {
                        return String(chartData.labels[tooltipItem[0].index]);
                    } else {
                        return (
                            chartData.labels[tooltipItem[0].index] +
                            ' Total: ' +
                            formatNumber(totalValue)
                        );
                    }
                } else {
                    return String(chartData.labels[tooltipItem[0].index]);
                }
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
    isXAxis = false
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
        } else if (!isXAxis) {
            // for yAxis, default min to 0 unless specified
            axis.ticks = {
                ...axis.ticks,
                min: 0,
            };
        }
    }

    return axis;
}
