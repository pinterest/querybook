const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

module.exports = async ({ config }) => {
    config.module.rules.push({
        test: /\.(css|sass|scss)$/,
        use: [
            MiniCssExtractPlugin.loader,
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
                    includePaths: ['node_modules'],
                },
            },
        ],
        include: path.resolve(__dirname, 'datahub/webapp/'),
    });
    config.module.rules.push({
        test: /\.ya?ml$/,
        include: path.resolve(__dirname, 'datahub/config'),
        loader: 'json-loader!yaml-loader',
    });
    config.module.rules.push({
        test: /\.(ts|tsx)$/,
        loader: require.resolve('babel-loader'),
        // options: {
        //     presets: [['react-app', { typescript: true }]],
        // },
    });
    config.resolve.extensions.push('.ts', '.tsx');
    config.resolve.modules = [
        ...(config.resolve.modules || []),
        path.resolve('./datahub/webapp'),
    ];
    return config;
};
