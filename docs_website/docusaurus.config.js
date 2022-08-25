module.exports = {
    title: 'Querybook',
    tagline: 'Data made simple.',
    url: 'https://querybook.com',
    baseUrl: '/',
    organizationName: 'pinterest',
    projectName: 'querybook-documentation-site',
    scripts: ['https://buttons.github.io/buttons.js'],
    favicon: 'img/querybook.svg',
    customFields: {
        fonts: {
            myFont: ['Inter', '-apple-system', 'system-ui', 'Segoe UI'],
            myOtherFont: ['-apple-system', 'system-ui'],
        },
    },
    onBrokenLinks: 'log',
    onBrokenMarkdownLinks: 'log',
    presets: [
        [
            '@docusaurus/preset-classic',
            {
                docs: {
                    showLastUpdateAuthor: true,
                    showLastUpdateTime: true,
                    path: 'docs',
                    routeBasePath: 'docs',
                    sidebarPath: './sidebars.json',
                },
                theme: {
                    customCss: [require.resolve('./src/css/custom.scss')],
                },
                gtag: {
                    trackingID: 'G-ZV2Q3M58R9',
                },
            },
        ],
    ],
    plugins: ['docusaurus-plugin-sass'],
    themeConfig: {
        navbar: {
            title: 'Querybook',
            logo: {
                src: 'img/querybook.svg',
                srcDark: 'img/querybook.svg',
            },
            items: [
                {
                    to: 'docs/',
                    label: 'Docs',
                    position: 'left',
                },
                {
                    to: 'https://github.com/pinterest/querybook',
                    position: 'left',
                    label: 'GitHub',
                },
                {
                    to: 'https://join.slack.com/t/querybook/shared_invite/zt-se82lvld-yyzRIqvIASsyYozk7jMCYQ',
                    position: 'left',
                    label: 'Slack',
                },
            ],
        },
        image: 'img/undraw_online.svg',
        footer: {
            style: 'dark',
            links: [
                {
                    title: 'Docs',
                    items: [
                        {
                            label: 'Quick Start',
                            to: 'docs/',
                        },
                        {
                            label: 'Deployment Guide',
                            to: 'docs/setup_guide/deployment_guide',
                        },
                        {
                            label: 'Developer Setup',
                            to: 'docs/developer_guide/developer_setup',
                        },
                    ],
                },
                {
                    title: 'Contact',
                    items: [
                        {
                            label: 'Email',
                            href: 'mailto:querybook@pinterest.com',
                        },
                        {
                            label: 'Slack',
                            href: 'https://join.slack.com/t/querybook/shared_invite/zt-se82lvld-yyzRIqvIASsyYozk7jMCYQ',
                        },
                    ],
                },
                {
                    title: 'More',
                    items: [
                        {
                            label: 'Changelog',
                            to: 'docs/changelog',
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} Pinterest. Built with Docusaurus.`,
        },
        algolia: {
            apiKey: 'fdaa985607f0df46d22edf5e6e01778c',
            indexName: 'querybook',
            appId: 'BH4D9OD16A',
        },
    },
};
