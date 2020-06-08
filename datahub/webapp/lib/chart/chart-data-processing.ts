import { ChartDataSets, ChartData as ChartJsData } from 'chart.js';
import { ChartData } from 'react-chartjs-2';

import { IDataChartCellMeta } from 'const/datadoc';
import { ChartScaleType } from 'const/dataDocChart';

import { colorPalette, colorPaletteFill, fillColor } from 'const/chartColors';

export function processChartJSData(
    data: any[][],
    meta: IDataChartCellMeta,
    theme: string,
    xAxesScaleType: ChartScaleType
): ChartData<ChartJsData> {
    // The default input for all chart type is wide
    if (!data.length) {
        return { labels: [], datasets: [] };
    }

    const { chart: chartMeta } = meta;

    const xAxisIdx = chartMeta.x_axis.col_idx;
    const seriesNames: string[] = data[0];
    const dataRows = data.slice(1);

    // hide hidden series
    const hiddenSeriesIndices = new Set();
    for (const [key, val] of Object.entries(chartMeta.y_axis.series || {})) {
        if (val.hidden) {
            hiddenSeriesIndices.add(Number(key));
        }
    }

    let firstDataset = true;
    const coloredSeries: Record<number, number> = {};
    for (const seriesIdx in chartMeta.y_axis.series) {
        if ('color' in (chartMeta.y_axis.series[seriesIdx] || {})) {
            coloredSeries[seriesIdx] = chartMeta.y_axis.series[seriesIdx].color;
        }
    }

    const chartDatasets = seriesNames
        .map((seriesName, idx) => {
            if (idx === xAxisIdx || hiddenSeriesIndices.has(idx)) {
                return null;
            }

            const dataset: ChartDataSets = {
                label: seriesName,
                borderWidth: 2,
                lineTension: 0,
            };

            // scatter and bubble has a different data structure
            if (chartMeta.type === 'scatter') {
                dataset['pointRadius'] = 4;
                dataset['data'] = dataRows.map((row) => ({
                    x:
                        xAxesScaleType === 'time'
                            ? Number(new Date(row[xAxisIdx]))
                            : Number(row[xAxisIdx]),
                    y: Number(row[idx]),
                }));
            } else if (chartMeta.type === 'bubble') {
                const rAxisIdx = chartMeta.z_axis;
                dataset['data'] = dataRows.map((row) => ({
                    x:
                        xAxesScaleType === 'time'
                            ? Number(new Date(row[xAxisIdx]))
                            : Number(row[xAxisIdx]),
                    y: Number(row[idx]),
                    r: Number(row[rAxisIdx]),
                }));
            } else {
                dataset['data'] = dataRows.map((row) => Number(row[idx]));
            }

            // Assign colors -----------------------------------------------
            const colorIdx = coloredSeries[idx] ?? idx;
            if (chartMeta.type === 'pie' || chartMeta.type === 'doughnut') {
                // TODO: add custom color support in future?
                dataset.backgroundColor = dataRows.map(
                    (_, rowColorIdx) =>
                        colorPalette[rowColorIdx % colorPalette.length]
                );
            } else {
                dataset.borderColor =
                    colorPalette[colorIdx % colorPalette.length];
                dataset.backgroundColor = [
                    'area',
                    'bar',
                    'histogram',
                    'bubble',
                    'scatter',
                ].includes(chartMeta.type)
                    ? colorPaletteFill[colorIdx % colorPaletteFill.length]
                    : (dataset.backgroundColor = fillColor[theme]);
                if (
                    chartMeta.type === 'bubble' ||
                    chartMeta.type === 'scatter'
                ) {
                    dataset.borderWidth = 1;
                    dataset.hoverBorderWidth = 1;
                }
            }

            // only area gets fill
            dataset.fill =
                chartMeta.type === 'area'
                    ? firstDataset
                        ? 'origin'
                        : '-1'
                    : false;
            firstDataset = false;

            return dataset;
        })
        .filter((dataset) => dataset);

    return {
        labels: dataRows.map((row) => row[xAxisIdx]),
        datasets: chartDatasets,
    };
}
