const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const postcssPresetEnv = require('postcss-preset-env');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CleanObsoleteChunks = require('webpack-clean-obsolete-chunks');
const TsconfigPathsWebpackPlugin = require('tsconfig-paths-webpack-plugin');

const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const BUILD_DIR = 'dist/webapp';

function getDevServerSettings(env, PROD) {
    if (PROD) {
        // No dev server in prod
        return {};
    }

    const DEVSERVER_PORT = 3000;
    const DATAHUB_UPSTREAM =
        (env && env.DATAHUB_UPSTREAM) || `http://localhost:${DEVSERVER_PORT}`;
    const settings = {
        hot: true,

        historyApiFallback: {
            index: '/build/index.html',
        },
        proxy: {
            '/ds/*': {
                target: DATAHUB_UPSTREAM,
                changeOrigin: true,
                secure: false,
                headers: {
                    // can add custom headers here
                    // "X-name": "value"
                },
                pathRewrite: function (req) {},
                bypass: function (req, res, proxyOptions) {},
            },
            '/-/socket.io/*': {
                target: DATAHUB_UPSTREAM,
                changeOrigin: true,
                ws: true,
            },
            '/static/*': {
                target: DATAHUB_UPSTREAM,
                changeOrigin: true,
            },
        },
        port: DEVSERVER_PORT,
        publicPath: '/build/',
    };

    if (env && env.DATAHUB_COOKIE) {
        for (const proxyPath in settings.proxy) {
            settings.proxy[proxyPath]['headers'] = {
                Cookie: env.DATAHUB_COOKIE,
            };
        }
    }

    return settings;
}

module.exports = (env) => {
    const PROD = env && env.NODE_ENV && env.NODE_ENV === 'production';

    const entry = {
        react_hot_loader: 'react-hot-loader/patch',
        react_app: './datahub/webapp/index.tsx',
        vendor: './datahub/webapp/vendor.tsx',
    };

    const devTool = PROD
        ? {}
        : {
              // https://webpack.js.org/plugins/source-map-dev-tool-plugin/
              devtool: false,
          };

    const watchOptions = PROD
        ? {}
        : {
              watchOptions: {
                  poll: 1000,
              },
          };

    const customScriptPath = !!process.env.DATAHUB_PLUGIN
        ? path.resolve(
              process.env.DATAHUB_PLUGIN,
              './webpage_plugin/custom_script.js'
          )
        : null;
    if (customScriptPath != null && fs.existsSync(customScriptPath)) {
        entry.custom = customScriptPath;
    }

    return {
        entry,
        mode: PROD ? 'production' : 'development',

        devServer: getDevServerSettings(env),

        output: {
            filename: '[name].[hash].js',
            path: path.resolve(__dirname, BUILD_DIR),
            publicPath: '/build/',

            // https://github.com/webpack/webpack/issues/6642
            globalObject: 'this',
        },

        resolve: {
            // Add '.ts' and '.tsx' as resolvable extensions.
            extensions: ['.ts', '.tsx', '.js', '.json', '.scss'],
            plugins: [new TsconfigPathsWebpackPlugin({})],
            alias: PROD
                ? {}
                : {
                      'react-dom': '@hot-loader/react-dom',
                  },
        },

        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: 'babel-loader',
                    exclude: [/[\\/]node_modules[\\/]/],
                },

                {
                    test: /\.(css|sass|scss)$/,
                    use: [
                        PROD ? MiniCssExtractPlugin.loader : 'style-loader',
                        'css-loader',
                        {
                            loader: 'postcss-loader',
                            options: {
                                ident: 'postcss',
                                plugins: () => [
                                    postcssPresetEnv(/* pluginOptions */),
                                ],
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                includePaths: ['node_modules'],
                            },
                        },
                    ],
                },

                // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
                {
                    test: /\.tsx?$/,
                    enforce: 'pre',
                    loader: 'source-map-loader',
                    exclude: [/[\\/]node_modules[\\/]/],
                },

                {
                    test: /\.ya?ml$/,
                    include: path.resolve(__dirname, 'datahub/config'),
                    loader: 'json-loader!yaml-loader',
                },
            ],
        },

        optimization: {
            splitChunks: {
                cacheGroups: {
                    default: false,
                    commons: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendor',
                        chunks: 'all',
                    },
                },
            },
        },

        ...devTool,
        ...watchOptions,

        plugins: [
            new CleanObsoleteChunks(),
            new CleanWebpackPlugin([BUILD_DIR]),
            new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
            new webpack.LoaderOptionsPlugin({
                options: {
                    worker: {
                        output: {
                            filename: '[hash].worker.js',
                            chunkFilename: '[id].[hash].worker.js',
                        },
                    },
                },
            }),
            new MiniCssExtractPlugin({
                filename: '[name].[contenthash:4].css',
            }),
            new HtmlWebpackPlugin({
                title: 'DataHub',
                template: './datahub/webapp/index.html',
                chunks: ['react_hot_loader', 'vendor', 'react_app'].concat(
                    entry.custom ? ['custom'] : []
                ),
                chunksSortMode: 'manual',
            }),
            new webpack.SourceMapDevToolPlugin({
                filename: '[name].js.map',
                exclude: [/vendor/],
            }),
        ],
    };
};
