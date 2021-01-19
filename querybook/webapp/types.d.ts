import { reduxStore } from 'redux/store';
import type {
    IColumnStatsAnalyzer,
    IColumnDetector,
    IColumnTransformer,
} from 'lib/query-result/types';

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
        CUSTOM_COLUMN_STATS_ANALYZERS?: IColumnStatsAnalyzer[];
        CUSTOM_COLUMN_DETECTORS?: IColumnDetector[];
        CUSTOM_COLUMN_TRANSFORMERS?: IColumnTransformer[];
    }

    // Injected via Webpack
    const __VERSION__: string;
    const __APPNAME__: string;
}
