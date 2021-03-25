module.exports = (api) => {
    const isProd = api.env('production');

    return {
        presets: [
            [
                '@babel/preset-react',
                {
                    // uncomment to use why-did-you-render
                    // runtime: 'automatic',
                    // development: !isProd,
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
            'react-hot-loader/babel',
            [
                'babel-plugin-styled-components',
                {
                    pure: true,
                    displayName: !isProd,
                },
            ],
        ],
        sourceMaps: true,
    };
};
