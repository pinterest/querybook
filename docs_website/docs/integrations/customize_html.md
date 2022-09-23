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

You can view the list of shortcuts under `querybook/webapp/const/keyMap.ts`. If you want to customize it for users in your workspace, supply the `window.CUSTOM_KEY_MAP` variable. Here is an example that changes the run query shortcut from `shift-enter` to `cmd-enter`.

```typescript
window.CUSTOM_KEY_MAP = {
    queryEditor: {
        runQuery: {
            key: 'Cmd-Enter',
        },
    },
};
```

When adding a new key binding, follow the format of Codemirror as documented [here](https://codemirror.net/doc/manual.html#keymaps). Use `cmd` in place of `ctrl` whenever possible as it would work for both mac and windows. Note that you can only override existing values which means adding a new key would be considered a noop.

### Customize data table filters

You can set default parameters for table filters. You can add all examples from this part to file `querybook/plugins/webpage_plugin/custom_script.ts`.

Which parameters you can customize:

1. `Featured` flag. You can set up this filter selected by default using next code:

```typescript
window.DATA_TABLE_SEARCH_CONFIG = {
    getInitialState: (initialState) => ({
        ...initialState,
        searchFilters: {
            golden: true,
        },
    }),
};
```

2. If you want to use searching for some schema by default, you can set this parameter using next code:

```typescript
window.DATA_TABLE_SEARCH_CONFIG = {
    getInitialState: (initialState) => ({
        ...initialState,
        searchFilters: {
            schema: 'main',
        },
    }),
};
```

3. By default search field works for `table_name` field but you set any other valid field (table_name, description or column).
   So, you can set the field with value `true`. This is the example of setting `description` as default search field.

```typescript
window.DATA_TABLE_SEARCH_CONFIG = {
    getInitialState: (initialState) => ({
        ...initialState,
        searchFields: {
            description: true,
        },
    }),
};
```

### Customize UDF Support

If your query engine supports UDFs/Stored Procedures, you can use the custom UDF plugin to let users add UDFs easily in the query editor. The UDF editor in Querybook allows users to quickly create UDFs by filling out a form.

Also note that if it something standard, please contribute it to the open source repo!

Here is an minimal example that adds mysql UDF, it is not an complete example:

```typescript
window.CUSTOM_ENGINE_UDFS = {
    engineLanguage: 'mysql',
    supportedUDFLanguages: [
        {
            displayName: 'SQL',
            name: 'sql', // Used as LANGUAGE ... in UDF, for mysql only sql works
            codeEditorMode: 'text/x-mysql', // this mode is used by codemirror for editor support
        },
    ],
    dataTypes: [
        'varchar',
        'double',
        'integer',
    ],
    renderer: (config) => {
       renderer: (config) => {
        const {
            functionName,
            udfLanguage,
            outputType,
            parameters,
            script,
        } = config;

        /*
            Example MYSQL stored procedure:
            CREATE PROCEDURE exampleFunc(IN rating varchar(50))
            BEGIN
                select abc from table where r = rating;
            END
        */

        const createStatement = `CREATE PROCEDURE ${functionName}`;
        const udfSignature = `(${parameters
            .map((param) => `IN ${param.name} ${param.type}`)
            .join(', ')})`;
        const code = `BEGIN\n${script}\nEND`;

        return `${createStatement}${udfSignature}\n${code};`;
    },
    },
}
```

### (Experimental) Row Limit Scale

Querybook provides an experimental query engine feature that auto transforms select
queries without limit into select queries with limit. By default, users can choose
limits between 10^1,10^2,...,10^5 and the default limit is 10^3.

However, you can also customize the scale and default value by modifying the following
window variables:

```js
// now user can only pick between these values
window.ROW_LIMIT_SCALE = [8, 64, 512, 4096, 32768];
// the default limit is now 4096
window.DEFAULT_ROW_LIMIT = 4096;
// this removes the option for user to pick limit: none
window.ALLOW_UNLIMITED_QUERY = false;
```

### (Experimental) Custom error tooltip

Whenever there is a query error, you can provide a custom suggestion message by providing this function:

```js
window.GET_QUERY_ERROR_SUGGESTION?: (
    queryError: IQueryError,
    queryExecution: IQueryExecution,
    statementExecutions: IStatementExecution[],
    queryEngine: IQueryEngine
) => string;
```

You would have the full knowledge of the query error message, the query engine, and the query text. Note
that it is always the last statement execution that caused the error.

The return value is string and the message would get converted into rich text via the Markdown renderer. So you can
also insert urls, images, or formatted text based on Markdown syntax.

Here are example suggestions you can add:

-   Add a specific config based on the error message
-   Redirect user to read the internal query guide
-   Tell users to ask about the error in the support Slack channel
