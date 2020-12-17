module.exports = {
    title: 'Querybook',
    tagline: 'Data made simple.',
    url: 'https://querybook.com',
    baseUrl: '/',
    organizationName: 'pinterest',
    projectName: 'querybook-documentation-site',
    scripts: ['https://buttons.github.io/buttons.js'],
    favicon: 'img/favicon.ico',
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
                    path: '../docs',
                    routeBasePath: 'docs',
                    sidebarPath: './sidebars.json',
                },
                theme: {
                    customCss: [require.resolve('./src/css/custom.scss')],
                },
            },
        ],
    ],
    plugins: ['docusaurus-plugin-sass'],
    themeConfig: {
        navbar: {
            title: 'Querybook',
            logo: {
                src: 'img/favicon.ico',
                srcDark: 'img/favicon.ico',
            },
            items: [
                {
                    to: 'docs/',
                    label: 'Documentation',
                    position: 'right',
                },
                {
                    to: '/waitlist',
                    label: 'Waitlist',
                    position: 'right',
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
                            to: 'docs/admin_guide/deployment_guide',
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
                            href:
                                'https://querybookchat.slack.com/join/shared_invite/zt-dpr988af-9VwGkjcmPhqTmRoA2Tm3gg#/',
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
    },
};
