import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import QueryComposer from 'components/QueryComposer/QueryComposer';
import { useResource } from 'hooks/useResource';
import { IAdhocQuery } from 'const/adhocQuery';
import { receiveAdhocQuery } from 'redux/adhocQuery/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { EmbeddedResource } from 'resource/embedded';
import { Button } from 'ui/Button/Button';
import { FullHeight } from 'ui/FullHeight/FullHeight';

import './EmbeddedQueryPage.scss';

function isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
    if (allowedOrigins.length === 0 || origin === window.location.origin) {
        return true;
    }

    return allowedOrigins.some((allowed) => origin === new URL(allowed).origin);
}

const EmbeddedQueryPage: React.FunctionComponent = () => {
    const environmentId = useSelector(
        (state: IStoreState) => state.environment.currentEnvironmentId
    );
    const query = useSelector(
        (state: IStoreState) => state.adhocQuery[environmentId]?.query ?? ''
    );

    const { data: allowedOrigins } = useResource(
        EmbeddedResource.getAllowedOrigins
    );

    const dispatch: Dispatch = useDispatch();
    const setQuery = React.useCallback(
        (adhocQuery: IAdhocQuery) =>
            dispatch(receiveAdhocQuery(adhocQuery, environmentId)),
        [dispatch, environmentId]
    );

    const onMessage = React.useCallback(
        (e: MessageEvent) => {
            if (!e.data || e.data.type !== 'SET_QUERY') {
                return;
            }

            if (!isOriginAllowed(e.origin, allowedOrigins)) {
                console.warn(
                    `[EmbeddedQueryPage] Blocked postMessage from untrusted origin: ${e.origin}`
                );
                return;
            }

            const query: IAdhocQuery = {};
            if (e.data.value) {
                query.query = e.data.value;
            }
            if (e.data.engine) {
                query.engineId = e.data.engine;
            }

            setQuery(query);
        },
        [allowedOrigins, setQuery]
    );

    React.useEffect(() => {
        if (!allowedOrigins) {
            return;
        }

        // Tell the parent we are ready to receive query after allowed origins are loaded
        window.parent.postMessage({ type: 'SEND_QUERY' }, '*');
    }, [allowedOrigins]);

    React.useEffect(() => {
        if (!allowedOrigins) {
            return;
        }

        // Attach event listener to receive query from parent
        window.addEventListener('message', onMessage, false);
        return () => {
            window.removeEventListener('message', onMessage);
        };
    }, [allowedOrigins, onMessage]);

    return (
        <FullHeight flex={'column'} className="EmbeddedQueryPage">
            <div className="query-composer-wrapper">
                <QueryComposer />
            </div>
            <div className="control-bar right-align">
                <Button
                    color="confirm"
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

export default EmbeddedQueryPage;
