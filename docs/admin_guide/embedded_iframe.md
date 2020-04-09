---
id: embedded_iframe
title: Embed DataHub As Iframe
sidebar_label: Embed Iframe
---

You can embed DataHub as an iframe in other tools so users can edit query directly on DataHub, test it out, and then update it back. Here are the steps to implement this feature:

1. Include the following HTML
```html
<iframe
    id="datahub-iframe"
    src="https://{DATAHUB_URL}/data/_/embedded_editor/"
/>
```
2. When the iframe loads, there will be 2 kinds of events that can be send back, please handle them by adding an event listener to window:
```js
window.addEventListener('message', (e) => {
    // Determine the event type here
    const type = e?.data?.type;


    if (type === 'SEND_QUERY') {
        // If it is a send query event, please send the
        // datahub iframe the query being edited
        iframeEl?.contentWindow?.postMessage(
            { type: 'SET_QUERY', value: query },
            '*'
        );
    } else if (type === 'SUBMIT_QUERY') {
        // If it is a submit query event, it means the user
        // has finished editing the query in datahub, please
        // update your query in your tool accordingly
        updateQuery(e?.data?.value);
    }
}, false);
```
