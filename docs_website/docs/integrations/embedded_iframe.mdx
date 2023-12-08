---
id: embedded_iframe
title: Embed Querybook As Iframe
sidebar_label: Embed Iframe
---

You can embed Querybook as an iframe in other tools so users can edit query directly on Querybook, test it out, and then update it back. Here are the steps to implement this feature:

1. Include the following HTML

```html
<iframe
    id="querybook-iframe"
    src="https://{QUERYBOOK_URL}/{ENVIRONMENT_NAME}/_/embedded_editor/"
/>
```

2. When the iframe loads, there will be 2 kinds of events that can be send back, please handle them by adding an event listener to window:

```js
window.addEventListener(
    'message',
    (e) => {
        // Determine the event type here
        const type = e?.data?.type;

        if (type === 'SEND_QUERY') {
            // If it is a send query event, please send the
            // querybook iframe the query being edited
            iframeEl?.contentWindow?.postMessage(
                { type: 'SET_QUERY', value: query },
                '*'
            );
        } else if (type === 'SUBMIT_QUERY') {
            // If it is a submit query event, it means the user
            // has finished editing the query in querybook, please
            // update your query in your tool accordingly
            updateQuery(e?.data?.value);
        }
    },
    false
);
```
