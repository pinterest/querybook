import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { QueryComposer } from 'components/QueryComposer/QueryComposer';
import { IAdhocQuery } from 'const/adhocQuery';
import { IStoreState, Dispatch } from 'redux/store/types';
import { receiveAdhocQuery } from 'redux/adhocQuery/action';
import { FullHeight } from 'ui/FullHeight/FullHeight';
import { Button } from 'ui/Button/Button';
import './EmbeddedQueryPage.scss';

export const EmbeddedQueryPage: React.FunctionComponent = () => {
    const environmentId = useSelector(
        (state: IStoreState) => state.environment.currentEnvironmentId
    );
    const query = useSelector(
        (state: IStoreState) => state.adhocQuery[environmentId]?.query ?? ''
    );

    const dispatch: Dispatch = useDispatch();
    const setQuery = React.useCallback(
        (query: IAdhocQuery) =>
            dispatch(receiveAdhocQuery(query, environmentId)),
        []
    );

    const onMessage = React.useCallback((e) => {
        if (e.data && e.data.type === 'SET_QUERY') {
            const query: IAdhocQuery = {};
            if (e.data.value) {
                query.query = e.data.value;
            }
            if (e.data.engine) {
                query.engineId = e.data.engine;
            }

            setQuery(query);
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
                    type="confirm"
                    title="Save Query"
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
