// import './wdyr';
import React, { useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Provider } from 'react-redux';

import { AppRouter } from 'components/AppRouter/AppRouter';
import { ComponentType } from 'const/analytics';
import { trackClick } from 'lib/analytics';
import { PythonProvider } from 'lib/python/python-provider';
import { reduxStore } from 'redux/store';

// Make debugging easier
window.reduxStore = reduxStore;

export const App = () => {
    useEffect(() => {
        const handleTabFocus = () => {
            trackClick({
                component: ComponentType.APP,
                aux: {
                    action: 'focus',
                },
            });
        };

        const handleTabBlur = () => {
            trackClick({
                component: ComponentType.APP,
                aux: {
                    action: 'blur',
                },
            });
        };

        window.addEventListener('focus', handleTabFocus);
        window.addEventListener('blur', handleTabBlur);

        return () => {
            window.removeEventListener('focus', handleTabFocus);
            window.removeEventListener('blur', handleTabBlur);
        };
    }, []);

    return (
        <DndProvider backend={HTML5Backend}>
            <Provider store={reduxStore}>
                <PythonProvider>
                    <AppRouter />
                </PythonProvider>
            </Provider>
        </DndProvider>
    );
};
