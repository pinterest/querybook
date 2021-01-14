const postcssPresetEnv = require('postcss-preset-env');
const path = require('path');

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
        loader: 'json-loader!yaml-loader',
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

    return config;
};
