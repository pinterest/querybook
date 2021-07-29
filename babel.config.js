module.exports = (api) => {
    const isDev = api.env('development');
    const isTest = api.env('test');

    return {
        presets: [
            [
                '@babel/preset-react',
                {
                    // uncomment to use why-did-you-render
                    // runtime: 'automatic',
                    // development: isDev,
                    // importSource: '@welldone-software/why-did-you-render',
                },
            ],
            [
                '@babel/preset-typescript',
                {
                    isTSX: true,
                    allExtensions: true,
                },
            ],
            [
                '@babel/preset-env',
                {
                    // modules: false,
                    targets: {
                        node: 'current',
                    },
                },
            ],
        ],
        plugins: [
            [
                '@babel/plugin-proposal-decorators',
                {
                    legacy: true,
                },
            ],
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-nullish-coalescing-operator',
            '@babel/plugin-proposal-optional-chaining',
            [
                'babel-plugin-transform-imports',
                {
                    lodash: {
                        transform: 'lodash/${member}',
                        preventFullImport: true,
                    },
                    'react-virtualized': {
                        transform: 'react-virtualized/dist/es/${member}',
                        preventFullImport: true,
                    },
                },
            ],
            [
                'babel-plugin-styled-components',
                {
                    pure: true,
                    // dev: for html className
                    // test: for snapshot
                    displayName: isDev || isTest,
                },
            ],
            isDev && require.resolve('react-refresh/babel'),
        ].filter(Boolean),
        sourceMaps: true,
    };
};
