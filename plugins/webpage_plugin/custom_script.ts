// Place your custom css/js logic here
import React from 'react';

export {};

// Row limit scale customization
window.ROW_LIMIT_SCALE = [1000, 10000, 100000];
window.DEFAULT_ROW_LIMIT = 1000;
window.ALLOW_UNLIMITED_QUERY = true;

interface IColumnDetector {
    type: string;
    priority: number;
    checker: (colName: string, values: any[]) => boolean;
}

interface IColumnStatsAnalyzer {
    key: string;
    name: string;
    appliesToType: string[];
    generator: (values: any[]) => string;
}

interface IColumnTransformer {
    key: string;
    name: string;

    appliesToType: string[];
    priority: number;
    auto: boolean;

    transform: (v: any) => React.ReactNode;
}

// Use the following definitions to override default Querybook
// behavior
declare global {
    /* tslint:disable:interface-name */
    interface Window {
        // Users will see this message if they cannot
        // access any
        NO_ENVIRONMENT_MESSAGE?: string;
        ROW_LIMIT_SCALE?: number[];
        DEFAULT_ROW_LIMIT?: number;
        ALLOW_UNLIMITED_QUERY?: boolean;
        CUSTOM_LANDING_PAGE?: {
            // Two modes of custom landing page
            // replace: replace the entire landing page with custom content
            // not specified: add the custom content to the middle of the
            //                landing page
            mode?: 'replace';
            renderer: () => React.ReactElement;
        };
        CUSTOM_COLUMN_STATS_ANALYZERS?: IColumnStatsAnalyzer[];
        CUSTOM_COLUMN_DETECTORS?: IColumnDetector[];
        CUSTOM_COLUMN_TRANSFORMERS?: IColumnTransformer[];
        CUSTOM_KEY_MAP?: Record<
            string,
            Record<string, { key?: string; name?: string }>
        >;
    }
}
