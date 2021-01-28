import React from 'react';
import Link from '@docusaurus/Link';

export const keyFeatures = {
    key: 'Key Features',
    title: 'Querying done right',
    subtitle: `Querybook’s core focus is to make composing queries, creating analyses, and collaborating with others as simple as possible`,
    footer: () => (
        <>
            Check out <Link to="/docs/">our documentation</Link> to learn more
            about what Querybook can offer.
        </>
    ),

    featureItems: [
        {
            title: 'Collaborative DataDoc',
            content: `Organize rich text, queries, and charts into a notebook to easily document your analyses. Work collaboratively with others in a DataDoc and get real-time updates.`,
            image: 'key_features/collab.gif',
            imageClassName: 'box-shadowed-image',
        },
        {
            title: 'Smart Query Editor',
            content: `The Query Editor is aware of your tables and their columns, as such it provides autocompletion, syntax highlighting, and the ability to hover or click on a table to view its information.`,
            image: 'key_features/editor.gif',
            imageClassName: 'box-shadowed-image',
        },
        {
            title: 'Visualizations',
            content: `No need to leave Querybook to create charts to quickly visualize your results. With a familiar interface easily create line, bar, stacked area, pie, horizontal bar, donut, scatter, and table charts. Add them then to your DataDoc to complete your data narrative.`,
            image: 'key_features/visualization.gif',
            imageClassName: 'box-shadowed-image',
        },
        {
            title: 'Templating',
            content: `Write dynamically generated queries via Jinja2 templating. Set variables in DataDoc on the fly.`,
            image: 'key_features/templating.gif',
            imageClassName: 'box-shadowed-image',
        },
        {
            title: 'Scheduling',
            content: `Built-in scheduling functionality allows automatic DataDoc updates on set intervals. Combined with exporting, Querybook can send scheduled updates to external apps.`,
            image: 'key_features/scheduling.png',
            imageClassName: 'mac-box-shadow',
        },
        {
            title: 'Query Analytics',
            content: `Querybook auto analyzes executed queries to provide data lineage, example queries, frequent user information, search/auto-completion ranking.`,
            image: 'key_features/analytics.gif',
            imageClassName: 'box-shadowed-image',
        },
    ],
};

export const pluginFeatures = {
    key: 'Plugin Features',
    title: 'Suit your needs',
    subtitle: `Have a different tech stack? No problem. Every aspect of Querybook can be dynamically configured via the plugin system to let you fully leverage all of its features.`,
    footer: () => (
        <>
            Check out{' '}
            <Link to="/docs/integrations/plugins">our documentation</Link> to
            see all customization options.
        </>
    ),

    featureItems: [
        {
            title: 'Query Engine',
            content: `Supply your own query engine and add actionable error messages, useful metadata, and additional security measures.`,
            image: 'plugin_features/engine.png',
            imageClassName: 'mac-box-shadow',
        },
        {
            title: 'Exporter',
            content: `Upload query results from Querybook to other tools for further analyses.`,
            image: 'plugin_features/exporter.gif',
            imageClassName: 'box-shadowed-image',
        },
        {
            title: 'Notification',
            content: `Get notified upon completion of queries and DataDoc invitations via IM or email.`,
            image: 'plugin_features/notification.png',
            imageClassName: 'mac-box-shadow',
        },
        {
            title: 'Result Transform',
            content: `Augment query results to provide meaningful statistics and visualizations.`,
            image: 'plugin_features/transform.gif',
            imageClassName: 'box-shadowed-image',
        },
    ],
};
