import React from 'react';
import { QueryComposer } from 'components/QueryComposer/QueryComposer';
import { FullHeight } from 'ui/FullHeight/FullHeight';
import { Button } from 'ui/Button/Button';

import './EmbeddedQueryPage.scss';
import { useSelector, useDispatch } from 'react-redux';
import { IStoreState, Dispatch } from 'redux/store/types';
import { receiveAdhocQuery } from 'redux/adhocQuery/action';

export const EmbeddedQueryPage: React.FunctionComponent = () => {
    const environmentId = useSelector(
        (state: IStoreState) => state.environment.currentEnvironmentId
    );
    const query = useSelector(
        (state: IStoreState) => state.adhocQuery[environmentId]?.query ?? ''
    );

    const dispatch: Dispatch = useDispatch();
    const setQuery = React.useCallback(
        (newQuery: string) =>
            dispatch(receiveAdhocQuery({ query: newQuery }, environmentId)),
        []
    );

    const onMessage = React.useCallback((e) => {
        if (e.data && e.data.type === 'SET_QUERY') {
            setQuery(e.data.value);
        }
    }, []);

    React.useEffect(() => {
        // Tell the parent we are ready to receive query
        window.parent.postMessage({ type: 'SEND_QUERY' }, '*');
    }, []);

    // Setup query receiver
    React.useEffect(() => {
        window.addEventListener('message', onMessage, false);
        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, [onMessage]);

    return (
        <FullHeight flex={'column'} className="EmbeddedQueryPage">
            <div className="query-composer-wrapper">
                <QueryComposer />
            </div>
            <div className="control-bar right-align">
                <Button
                    title="Submit"
                    onClick={() => {
                        window.parent.postMessage(
                            { type: 'SUBMIT_QUERY', value: query },
                            '*'
                        );
                    }}
                />
            </div>
        </FullHeight>
    );
};
