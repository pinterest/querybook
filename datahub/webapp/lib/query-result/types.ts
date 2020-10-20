export interface IColumnDetector {
    type: string;
    priority: number;
    on: 'name' | 'value';
    checker: (v: any) => boolean;
}

export interface IColumnStatsPresenter {
    key: string;
    name: string;
    appliesToType: string[];
    generator: (values: any[]) => string;
}
