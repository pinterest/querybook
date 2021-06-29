---
id: customize_html
title: Customize HTML
sidebar_label: Customize HTML
---

Querybook allows for some basic customization in the frontend. You can use the web plugin to inject custom javascript into Querybook frontend. Please check [Plugins Guide](plugins.md) to see how to setup plugins. Once the plugins setup is completed, you would need to create a folder named `webpage_plugin` under the `plugins` folder and a typescript file with path `webpage_plugin/custom_script.ts` as the entrypoint.

Right now there are four use cases for custom javascript:

### Inject trackers such as google analytics.

For example:

```typescript
const script = document.createElement('script');
script.innerHTML = `
    ...
`;
document.body.appendChild(script);
```

### Customize some of the messages in Querybook.

Currently Querybook allows the plugin to set the following messages:

```typescript
interface Window {
    // Users will see this message if they cannot
    // access any
    NO_ENVIRONMENT_MESSAGE?: string;
}
```

You can set the message directly in the custom_script.ts:

```typescript
window.NO_ENVIRONMENT_MESSAGE = 'Lorem ipsum dolor sit amet.';
```

### Customize query result transformation.

With result transform, you can dding url link or to transform the text into image. To see the complete guide, please check out [Plugins Guide](add_query_result_transform.md) on how.

### Customize the landing page.

The landing page is the page shown with the route '/'. You can do so by modifying the window variable with the following type:

```typescript
interface Window {
    CUSTOM_LANDING_PAGE?: {
        mode?: 'replace';
        renderer: () => React.ReactElement;
    };
}
```

The renderer should be treated as the entry point into your customized react view. You can add any default HTML elements you want or import UI elements from Querybook.

If the mode variable is not provided, then Querybook would show this custom content in the middle section (currently empty) of the default landing page. However, if you specify the mode to be "replace", then the entire landing page will be replaced with your custom content.

### Customize shortcuts

You can view the list of shortcuts under `querybook/webapp/const/keyMap.ts`. If you want to customize it for users in your workspace, supply the `window.CUSTOM_KEY_MAP` variable. Here is an example that changes the run query shortcut from `shift-enter` to `cmd-enter`. Note that you can only override existing values which means adding a new key would be considered a noop.

```typescript
window.CUSTOM_KEY_MAP = {
    queryEditor: {
        runQuery: {
            key: 'Cmd-Enter',
        },
    },
};
```
