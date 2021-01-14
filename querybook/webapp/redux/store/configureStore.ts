import { createStore, applyMiddleware, compose } from 'redux';
// import invariant from 'redux-immutable-state-invariant';
// import { createLogger } from 'redux-logger';

import rootReducer from './rootReducer';
import ReduxThunk from 'redux-thunk';

// Re-enable for debugging
// const loggerMiddleware = createLogger();

const composeEnhancers =
    (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default function configureStore(preloadedState?) {
    const store = createStore(
        rootReducer,
        preloadedState,
        composeEnhancers(
            applyMiddleware(
                // invariant(),
                ReduxThunk
                // loggerMiddleware
            )
        )
    );

    return store;
}
