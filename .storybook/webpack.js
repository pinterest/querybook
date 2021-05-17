const postcssPresetEnv = require('postcss-preset-env');
const path = require('path');
const webpack = require('webpack');

module.exports = async (config) => {
    config.module.rules.push({
        test: /\.(css|sass|scss)$/,
        use: [
            'style-loader',
            'css-loader',
            {
                loader: 'postcss-loader',
                options: {
                    ident: 'postcss',
                    plugins: () => [postcssPresetEnv(/* pluginOptions */)],
                },
            },
            {
                loader: 'sass-loader',
                options: {
                    sassOptions: {
                        includePaths: ['node_modules'],
                    },
                },
            },
        ],
    });
    config.module.rules.push({
        test: /\.ya?ml$/,
        include: path.resolve(__dirname, 'querybook/config'),
        use: ['json-loader', 'yaml-loader'],
    });
    config.module.rules.push({
        test: /\.(ts|tsx)$/,
        loader: require.resolve('babel-loader'),
    });
    config.resolve.extensions.push('.ts', '.tsx');
    config.resolve.modules = [
        ...(config.resolve.modules || []),
        path.resolve('./querybook/webapp'),
    ];

    config.plugins.push(
        new webpack.DefinePlugin({
            __VERSION__: JSON.stringify(require('../package.json').version),
            __APPNAME__: JSON.stringify(
                process.env.QUERYBOOK_APPNAME ?? 'Querybook'
            ),
        })
    );

    return config;
};
