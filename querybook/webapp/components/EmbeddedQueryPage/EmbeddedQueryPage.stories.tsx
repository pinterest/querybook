import React from 'react';

export const _EmbeddedQueryPage = (args) => {
    const [queryText, _setQueryText] = React.useState('select 1;');
    const queryRef = React.useRef(queryText);
    const iframeRef = React.useRef<HTMLIFrameElement>();
    const [showEmbed, setShowEmbed] = React.useState(false);

    const setQuery = React.useCallback((newQuery: string) => {
        queryRef.current = newQuery;
        _setQueryText(newQuery);
    }, []);

    React.useEffect(() => {
        const listener = (e) => {
            // Determine the event type here
            const type = e?.data?.type;

            if (type === 'SEND_QUERY') {
                // If it is a send query event, please send the
                // querybook iframe the query being edited
                iframeRef.current?.contentWindow?.postMessage(
                    {
                        type: 'SET_QUERY',
                        value: queryRef.current,
                        engine: args.ENGINE_ID,
                    },
                    '*'
                );
            } else if (type === 'SUBMIT_QUERY') {
                // If it is a submit query event, it means the user
                // has finished editing the query in querybook, please
                // update your query in your tool accordingly

                setQuery(e?.data?.value);
                setShowEmbed(false);
            }
        };

        window.addEventListener('message', listener, false);

        return () => {
            window.removeEventListener('message', listener, false);
        };
    }, []);

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
                onChange={(event) => setQuery(event.target.value)}
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
