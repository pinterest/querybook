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
export const ChartScaleOptions: ChartScaleType[] = [
    'time',
    'category',
    'linear',
    'logarithmic',
];

export enum ChartScaleFormat {
    NONE = '',
    DOLLAR = '$',
    PERCENTAGE = '%',
}

export const chartTypeToAllowedAxisType: Partial<
    Record<ChartType, { x: ChartScaleType[]; y: ChartScaleType[] }>
> = {
    line: {
        x: ChartScaleOptions,
        y: ['linear', 'logarithmic'],
    },
    area: {
        x: ChartScaleOptions,
        y: ['linear', 'logarithmic'],
    },
    bar: {
        x: ['time', 'category'],
        y: ['linear', 'logarithmic'],
    },
    histogram: {
        x: ['time', 'category'],
        y: ['linear', 'logarithmic'],
    },
    pie: {
        x: ['category'],
        y: ['linear', 'logarithmic'],
    },
    doughnut: {
        x: ['category'],
        y: ['linear', 'logarithmic'],
    },
    scatter: {
        x: ChartScaleOptions,
        y: ['linear', 'logarithmic'],
    },
    bubble: {
        x: ChartScaleOptions,
        y: ['linear', 'logarithmic'],
    },
    table: {
        x: ChartScaleOptions,
        y: ChartScaleOptions,
    },
};

export interface IChartAxisMeta {
    label: string;
    scale?: ChartScaleType;
    min?: number;
    max?: number;
    format?: ChartScaleFormat;
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
    z_axis?: { col_idx: number };
}

export type ChartLegendPositionType = 'top' | 'bottom' | 'right' | 'left';

export enum ChartValueDisplayType {
    FALSE = 0,
    TRUE,
    AUTO,
}

export enum ChartValueSourceType {
    VALUE = 0,
    LABEL = 1,
}

export enum ChartSize {
    SMALL = 'sm',
    MEDIUM = 'md',
    LARGE = 'lg',
    AUTO = 'auto',
}

export interface IChartVisualMeta {
    legend_position?: ChartLegendPositionType;
    legend_display?: boolean;
    connect_missing?: boolean;
    size?: ChartSize;

    values?: {
        source: ChartValueSourceType;
        display: ChartValueDisplayType;
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
        limit?: number;
    };
    chart: IChartChartMeta;
    visual?: IChartVisualMeta;
}

export interface IChartFormValues {
    sourceType: ChartDataSourceType;
    cellId: number | undefined;
    executionId: number | undefined;
    limit: number;

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
    zIndex: number | undefined;

    chartType: ChartType;

    title: string;
    legendPosition: 'top' | 'bottom' | 'right' | 'left';
    legendDisplay: boolean;
    connectMissing: boolean;
    size: ChartSize;

    valueSource: ChartValueSourceType;
    valueDisplay: ChartValueDisplayType;
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
