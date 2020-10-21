// Place your custom css/js logic here

export {};

interface IColumnDetector {
    type: string;
    priority: number;
    on: 'name' | 'value';
    checker: (v: any) => boolean;
}

interface IColumnStatsPresenter {
    key: string;
    name: string;
    appliesToType: string[];
    generator: (values: any[]) => string;
}

// Use the following definitions to override default DataHub
// behavior
declare global {
    /* tslint:disable:interface-name */
    interface Window {
        // Users will see this message if they cannot
        // access any
        NO_ENVIRONMENT_MESSAGE?: string;
        CUSTOM_COLUMN_STATS_PRESENTER?: IColumnStatsPresenter[];
        CUSTOM_COLUMN_DETECTOR?: IColumnDetector[];
    }
}
