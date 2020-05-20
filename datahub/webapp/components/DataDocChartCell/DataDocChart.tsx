import {
    Line,
    Bar,
    HorizontalBar,
    Pie,
    Scatter,
    Doughnut,
    Bubble,
    defaults,
} from 'react-chartjs-2';
import React from 'react';
import { useSelector } from 'react-redux';
import Chart, { ChartOptions } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { IDataChartCellMeta } from 'const/datadoc';
import { ChartScaleType } from 'const/dataDocChart';
import { fontColor } from 'const/chartColors';
import { mapMetaToChartOptions } from 'lib/chart/chart-meta-processing';
import { getDefaultScaleType } from 'lib/chart/chart-utils';
import { processChartJSData } from 'lib/chart/chart-data-processing';
import { IStoreState } from 'redux/store/types';

interface IDataDocChartProps {
    meta: IDataChartCellMeta;
    data?: any[][];
    chartJsOptionObj?: ChartOptions;
}

Chart.plugins.unregister(ChartDataLabels);

function isChartValNull(val: any): boolean {
    // checks if chart value is null or "null"
    // only applies to query results in datahub
    return val === 'null' || val == null;
}

const useChartScale = (meta: IDataChartCellMeta, data?: any[][]) => {
    const xScale = meta?.chart?.x_axis?.scale;
    const xIndex = meta?.chart?.x_axis?.col_idx;
    const xAxesScaleType: ChartScaleType = React.useMemo(() => {
        let defaultScale: ChartScaleType = null;
        if (data?.length < 1) {
            return null;
        }
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!isChartValNull(row?.[xIndex])) {
                defaultScale = getDefaultScaleType(row?.[xIndex]);
                break;
            }
        }
        // For x scale, it is either time or auto detect
        return defaultScale === 'time' ? 'time' : null;
    }, [data, xIndex, xScale]);

    const yScale = meta?.chart?.y_axis?.scale;
    const ySeries = meta?.chart?.y_axis?.series || {};
    const yAxesScaleType = React.useMemo(() => {
        if (yScale != null) {
            return yScale;
        }

        if (data?.length < 2) {
            return null;
        }

        for (let i = 1; i < data.length; i++) {
            for (const [j, val] of data[i].entries()) {
                if (
                    !ySeries[j]?.hidden &&
                    j !== xIndex &&
                    !isChartValNull(val)
                ) {
                    return getDefaultScaleType(val);
                }
            }
        }
        return null;
    }, [data, yScale, ySeries, xIndex]);
    return [xAxesScaleType, yAxesScaleType];
};

export const DataDocChart: React.FunctionComponent<IDataDocChartProps> = ({
    meta,
    data = [],
    chartJsOptionObj = {},
}) => {
    const theme = useSelector(
        (state: IStoreState) => state.user.computedSettings.theme
    );

    React.useEffect(() => {
        defaults.global.defaultFontColor = `rgb(
                ${fontColor[theme][0]},
                ${fontColor[theme][1]},
                ${fontColor[theme][2]}
                )`;
        defaults.global.defaultFontFamily = 'Avenir Next';
        defaults.global.defaultFontSize = 14;
        defaults.global.plugins.filler.propagate = true;
        defaults.global.plugins.unregister = { ChartDataLabels: false };
    }, [theme]);

    const [xAxesScaleType, yAxesScaleType] = useChartScale(meta, data);

    const chartData = processChartJSData(data, meta, theme, xAxesScaleType);
    const chartJSOptions = {
        ...mapMetaToChartOptions(meta, theme, xAxesScaleType, yAxesScaleType),
        ...chartJsOptionObj,
    };

    const chartProps = {
        data: chartData,
        plugins: [ChartDataLabels],
        options: chartJSOptions,
    };

    let chartDOM = null;
    if (meta.chart.type === 'line' || meta.chart.type === 'area') {
        chartDOM = <Line {...chartProps} />;
    } else if (meta.chart.type === 'bar') {
        chartDOM = <Bar {...chartProps} />;
    } else if (meta.chart.type === 'histogram') {
        chartDOM = <HorizontalBar {...chartProps} />;
    } else if (meta.chart.type === 'pie') {
        chartDOM = <Pie {...chartProps} />;
    } else if (meta.chart.type === 'doughnut') {
        chartDOM = <Doughnut {...chartProps} />;
    } else if (meta.chart.type === 'scatter') {
        chartDOM = <Scatter {...chartProps} />;
    } else if (meta.chart.type === 'bubble') {
        chartDOM = <Bubble {...chartProps} />;
    }

    return chartDOM;
};
