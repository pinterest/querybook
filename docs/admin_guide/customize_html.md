---
id: customize_html
title: Customize HTML
sidebar_label: Customize HTML
---

DataHub allows for some basic customization in the frontend. You can use the web plugin to inject custom javascript into DataHub frontend. Please check [Plugins Guide](./plugins.md) to see how to get started.

Right now there are two use cases for custom javascript:

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
