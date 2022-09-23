import { IQueryEngine } from 'const/queryEngine';
import {
    IQueryError,
    IQueryExecution,
    IStatementExecution,
} from 'const/queryExecution';
import type {
    IColumnDetector,
    IColumnStatsAnalyzer,
    IColumnTransformer,
} from 'lib/query-result/types';
import type { IUDFEngineConfig } from 'lib/utils/udf';
import { IDataTableSearchState } from 'redux/dataTableSearch/types';
import { reduxStore } from 'redux/store';

declare global {
    /* eslint-disable @typescript-eslint/naming-convention */
    interface Window {
        reduxStore?: typeof reduxStore;
        receiveChildMessage?: () => void;

        // Web Plugin Variables
        NO_ENVIRONMENT_MESSAGE?: string;
        CUSTOM_LANDING_PAGE?: {
            // Two modes of custom landing page
            // replace: replace the entire landing page with custom content
            // not specified: add the custom content to the middle of the
            //                landing page
            mode?: 'replace';
            renderer: () => React.ReactElement;
        };
        DATA_TABLE_SEARCH_CONFIG?: {
            getInitialState: (
                initialState: IDataTableSearchState
            ) => IDataTableSearchState;
        };
        CUSTOM_COLUMN_STATS_ANALYZERS?: IColumnStatsAnalyzer[];
        CUSTOM_COLUMN_DETECTORS?: IColumnDetector[];
        CUSTOM_COLUMN_TRANSFORMERS?: IColumnTransformer[];
        CUSTOM_KEY_MAP?: Record<
            string,
            Record<string, { key?: string; name?: string }>
        >;
        CUSTOM_ENGINE_UDFS?: IUDFEngineConfig[];

        GET_QUERY_ERROR_SUGGESTION?: (
            queryError: IQueryError,
            queryExecution: IQueryExecution,
            statementExecutions: IStatementExecution[],
            queryEngine: IQueryEngine
        ) => string;

        /**
         * Possible values for automatic query limits.
         * Defaults from 10^1 to 10^5
         */
        ROW_LIMIT_SCALE?: number[];
        /**
         * Must be a value in ROW_LIMIT_SCALE
         */
        DEFAULT_ROW_LIMIT?: number;
        /**
         * If true, allow user to choose an option for unlimited query
         * However, users will be shown a warning modal when they run an unlimited
         * query
         */
        ALLOW_UNLIMITED_QUERY?: boolean;
    }

    // Injected via Webpack
    const __VERSION__: string;
    const __APPNAME__: string;
    const __ENVIRONMENT__: string;
}
