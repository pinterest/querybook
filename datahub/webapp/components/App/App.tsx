import { hot } from 'react-hot-loader/root';
import { setConfig } from 'react-hot-loader';
import React from 'react';
import { Provider } from 'react-redux';

import { AppRouter } from 'components/AppRouter/AppRouter';
import { ConfirmationManager } from 'components/ConfirmationManager/ConfirmationManager';
import { NotificationManager } from 'components/NotificationManager/NotificationManager';

import { reduxStore } from 'redux/store';

// Make debugging easier
(window as any).reduxStore = reduxStore;

const AppInner = () => (
    <Provider store={reduxStore}>
        <>
            <AppRouter />
            <ConfirmationManager />
            <NotificationManager />
        </>
    </Provider>
);

export const App = hot(AppInner);

// Setting this because otherwise this would make all not []
// useEffect reload
setConfig({
    reloadHooks: false,
});
