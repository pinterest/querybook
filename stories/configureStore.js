import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk';

const composeEnhancers = composeWithDevTools({});

const configureStore = () => {
    return createStore(
        () => {},
        undefined,
        composeEnhancers(
            applyMiddleware(thunk),
        )
    );
};

export default configureStore;