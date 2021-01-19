import { hot } from 'react-hot-loader/root';
import { setConfig } from 'react-hot-loader';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from 'react-redux';

import { AppRouter } from 'components/AppRouter/AppRouter';
import { ConfirmationManager } from 'components/ConfirmationManager/ConfirmationManager';
import { ToastManager } from 'ui/ToastManager/ToastManager';

import { reduxStore } from 'redux/store';

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
