import React, { useCallback } from 'react';
import { useStateWithRef } from 'hooks/useStateWithRef';
import { useEvent } from 'hooks/useEvent';

export const _EmbeddedQueryPage = (args) => {
    const [queryText, setQueryText, queryTextRef] = useStateWithRef('select 1');
    const [showEmbed, setShowEmbed] = React.useState(false);
    const iframeRef = React.useRef<HTMLIFrameElement>();

    useEvent(
        'message',
        useCallback((e) => {
            const type = e?.data?.type;

            if (type === 'SEND_QUERY') {
                iframeRef.current?.contentWindow?.postMessage(
                    {
                        type: 'SET_QUERY',
                        value: queryTextRef.current,
                        engine: args.ENGINE_ID,
                    },
                    '*'
                );
            } else if (type === 'SUBMIT_QUERY') {
                setQueryText(e?.data?.value);
                setShowEmbed(false);
            }
        }, [])
    );

    return showEmbed ? (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
            }}
        >
            <button onClick={() => setShowEmbed(false)}>Close Querybook</button>
            <iframe
                ref={iframeRef}
                style={{ flex: 1 }}
                id="querybook-iframe"
                src={`${args.QUERYBOOK_URL}/${args.ENVIRONMENT_NAME}/_/embedded_editor/`}
            />
        </div>
    ) : (
        <div>
            <textarea
                value={queryText}
                onChange={(event) => setQueryText(event.target.value)}
            />
            <button onClick={() => setShowEmbed(true)}>
                Open In Querybook
            </button>
        </div>
    );
};

_EmbeddedQueryPage.args = {
    QUERYBOOK_URL: 'http://localhost:10001',
    ENVIRONMENT_NAME: 'demo_environment',
    ENGINE_ID: 1,
};

export default {
    title: 'EmbeddedQuerybook',
};
