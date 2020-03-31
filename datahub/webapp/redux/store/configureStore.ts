import { createStore, applyMiddleware, compose } from 'redux';
// import invariant from 'redux-immutable-state-invariant';

import rootReducer from './rootReducer';
import { createLogger } from 'redux-logger';
import ReduxThunk from 'redux-thunk';

const loggerMiddleware = createLogger();

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
