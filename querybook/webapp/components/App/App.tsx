// import './wdyr';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from 'react-redux';

import { AppRouter } from 'components/AppRouter/AppRouter';
import { PythonProvider } from 'lib/python/python-provider';
import { reduxStore } from 'redux/store';

// Make debugging easier
window.reduxStore = reduxStore;

export const App = () => (
    <DndProvider backend={HTML5Backend}>
        <Provider store={reduxStore}>
            <PythonProvider>
                <AppRouter />
            </PythonProvider>
        </Provider>
    </DndProvider>
);
