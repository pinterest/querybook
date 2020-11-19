---
id: customize_html
title: Customize HTML
sidebar_label: Customize HTML
---

DataHub allows for some basic customization in the frontend. You can use the web plugin to inject custom javascript into DataHub frontend. Please check [Plugins Guide](./plugins.md) to see how to get started.

Right now there are four use cases for custom javascript:

1. Inject trackers such as google analytics. For example:

```typescript
const script = document.createElement('script');
script.innerHTML = `
    ...
`;
document.body.appendChild(script);
```

2. Customize some of the messages in DataHub. Currently DataHub allows the plugin to set the following messages:

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

3. Customize query result transformation such as adding url link or to transform the text into image. To see the complete guide, please check out [Plugins Guide](../developer_guide/add_query_result_transform.md) on how.
4. Customize the landing page for '/'. You can do so by modifying the window variable with the following type:

```typescript
interface Window {
    CUSTOM_LANDING_PAGE?: {
        mode?: 'replace';
        renderer: () => React.ReactElement;
    };
}
```

The renderer should be treated as the entry point into your customized react view. You can add any default HTML elements you want or import UI elements from DataHub.

If the mode variable is not provided, then DataHub would show this custom content in the middle section (currently empty) of the default landing page. However, if you specify the mode to be "replace", then the entire landing page will be replaced with your custom content.
