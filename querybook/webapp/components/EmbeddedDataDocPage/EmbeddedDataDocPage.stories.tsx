import React from 'react';

export const _EmbeddedDataDocPage = (args) => {
    const iframeRef = React.useRef<HTMLIFrameElement>();
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                width: '100%',
            }}
        >
            <iframe
                ref={iframeRef}
                style={{ flex: 1 }}
                id="querybook-datadoc-iframe"
                src={`${args.QUERYBOOK_URL}/${args.ENVIRONMENT_NAME}/_/embedded_datadoc/${args.DATADOC_ID}`}
            />
        </div>
    );
};

_EmbeddedDataDocPage.args = {
    QUERYBOOK_URL: 'http://localhost:10001',
    ENVIRONMENT_NAME: 'demo_environment',
    DATADOC_ID: 1,
};

export default {
    title: 'EmbeddedQuerybookDataDoc',
};
