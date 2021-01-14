import { hot } from 'react-hot-loader/root';
import { setConfig } from 'react-hot-loader';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from 'react-redux';

import {
    IColumnStatsAnalyzer,
    IColumnDetector,
    IColumnTransformer,
} from 'lib/query-result/types';
import { AppRouter } from 'components/AppRouter/AppRouter';
import { ConfirmationManager } from 'components/ConfirmationManager/ConfirmationManager';
import { ToastManager } from 'ui/ToastManager/ToastManager';

import { reduxStore } from 'redux/store';

// TODO: decouple this with App.tsx
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
}
// Make debugging easier
window.reduxStore = reduxStore;

const AppInner = () => (
    <DndProvider backend={HTML5Backend}>
        <Provider store={reduxStore}>
            <>
                <AppRouter />
                <ConfirmationManager />
                <ToastManager />
            </>
        </Provider>
    </DndProvider>
);

export const App = hot(AppInner);

// Setting this because otherwise this would make all not []
// useEffect reload
setConfig({
    reloadHooks: false,
});
