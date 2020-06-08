import { ITabItem } from 'ui/Tabs/Tabs';

export const formTabs: ITabItem[] = [
    {
        name: 'Data',
        key: 'data',
    },
    {
        name: 'Chart',
        key: 'chart',
    },
    {
        name: 'Visuals',
        key: 'visuals',
    },
];

export const tableTabs = [
    {
        key: 'original',
        name: 'Original Data',
    },
    {
        key: 'transformed',
        name: 'Transformed Data',
    },
];

export const sourceTypes = {
    cell_above: 'Cell Above',
    cell: 'Cell',
    execution: 'Execution',
};

export const chartTypes = {
    line: 'Line',
    area: 'Stacked Area',
    bar: 'Bar',
    histogram: 'Horizontal Bar',
    pie: 'Pie',
    doughnut: 'Doughnut',
    scatter: 'Scatter',
    bubble: 'Bubble',
    table: 'Table',
};

export const aggTypes: Record<ChartDataAggType, string> = {
    avg: 'Average',
    count: 'Count',
    min: 'Min',
    max: 'Max',
    med: 'Median',
    sum: 'Sum',
};

export type ChartDataAggType = 'avg' | 'count' | 'min' | 'max' | 'med' | 'sum';

export interface IChartSeriesMeta {
    source?: number;
    hidden?: boolean;
    color?: number;
    agg_type?: ChartDataAggType;
}

export type ChartScaleType = 'time' | 'category' | 'linear' | 'logarithmic';
export interface IChartAxisMeta {
    label: string;
    scale?: ChartScaleType;
    min?: number;
    max?: number;
}

export interface IChartXAxisMeta extends IChartAxisMeta {
    col_idx: number;
    sort?: {
        idx: number;
        asc: boolean;
    };
}

export interface IChartYAxisMeta extends IChartAxisMeta {
    series?: Record<number, IChartSeriesMeta>;
    stack?: boolean;
}

export type ChartType =
    | 'line'
    | 'area'
    | 'bar'
    | 'histogram'
    | 'pie'
    | 'doughnut'
    | 'scatter'
    | 'bubble'
    | 'table';

export interface IChartChartMeta {
    type?: ChartType;
    x_axis: IChartXAxisMeta;
    y_axis: IChartYAxisMeta;
    z_axis?: number;
}

export type ChartLegendPositionType = 'top' | 'bottom' | 'right' | 'left';

export enum chartValueDisplayType {
    FALSE = 0,
    TRUE,
    AUTO,
}

export interface IChartVisualMeta {
    legend_position: ChartLegendPositionType;
    values: {
        display: chartValueDisplayType;
        position: 'center' | 'start' | 'end';
        alignment:
            | 'center'
            | 'start'
            | 'end'
            | 'right'
            | 'left'
            | 'top'
            | 'bottom';
    };
}

export type ChartDataSourceType =
    | 'cell_above'
    | 'cell'
    | 'execution'
    | 'custom';

export interface IChartConfig {
    title: string;
    data: {
        source_type: ChartDataSourceType;
        source_ids?: number[];
        transformations: {
            format: {
                agg_col?: number;
                series_col?: number;
                value_cols?: number[];
            };
            aggregate?: boolean;
            switch?: boolean;
        };
    };
    chart: IChartChartMeta;
    visual?: IChartVisualMeta;
}

export interface IChartFormValues {
    sourceType: ChartDataSourceType;
    cellId: number | undefined;
    executionId: number | undefined;

    formatAggCol: number | undefined;
    formatSeriesCol: number | undefined;
    formatValueCols: number[];
    aggregate: boolean;
    switch: boolean;
    aggSeries: {
        [seriesIdx: number]: ChartDataAggType;
    };
    aggType: ChartDataAggType;

    xAxis: IChartAxisMeta;
    xIndex: number;
    sortIndex: number | undefined;
    sortAsc: boolean;
    yAxis: IChartAxisMeta;
    stack: boolean;
    hiddenSeries: number[];
    coloredSeries: { [seriesIdx: number]: number };
    zAxis: number | undefined;

    chartType: ChartType;

    title: string;
    legendPosition: 'top' | 'bottom' | 'right' | 'left';
    valueDisplay: chartValueDisplayType;
    valuePosition: 'center' | 'start' | 'end';
    valueAlignment:
        | 'center'
        | 'start'
        | 'end'
        | 'right'
        | 'left'
        | 'top'
        | 'bottom';
}
