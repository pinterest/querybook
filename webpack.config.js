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

function getDevServerSettings(env) {
    const QUERYBOOK_UPSTREAM = env && env.QUERYBOOK_UPSTREAM;
    if (!QUERYBOOK_UPSTREAM) {
        throw Error('Upstream API server is required for this to work');
    }

    const settings = {
        disableHostCheck: true,
        hot: true,

        historyApiFallback: {
            index: '/build/index.html',
        },
        proxy: {
            '/ds/*': {
                target: QUERYBOOK_UPSTREAM,
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
                target: QUERYBOOK_UPSTREAM,
                changeOrigin: true,
                ws: true,
            },
            '/static/*': {
                target: QUERYBOOK_UPSTREAM,
                changeOrigin: true,
            },
        },
        publicPath: '/build/',
        onListening: (server) => {
            const port = server.listeningApp.address().port;
            server.compiler.hooks.done.tap('done', () => {
                setImmediate(() => {
                    console.log('\033c');
                    console.log(`
                    ██████╗ ██╗   ██╗███████╗██████╗ ██╗   ██╗██████╗  ██████╗  ██████╗ ██╗  ██╗
                    ██╔═══██╗██║   ██║██╔════╝██╔══██╗╚██╗ ██╔╝██╔══██╗██╔═══██╗██╔═══██╗██║ ██╔╝
                    ██║   ██║██║   ██║█████╗  ██████╔╝ ╚████╔╝ ██████╔╝██║   ██║██║   ██║█████╔╝
                    ██║▄▄ ██║██║   ██║██╔══╝  ██╔══██╗  ╚██╔╝  ██╔══██╗██║   ██║██║   ██║██╔═██╗
                    ╚██████╔╝╚██████╔╝███████╗██║  ██║   ██║   ██████╔╝╚██████╔╝╚██████╔╝██║  ██╗
                     ╚══▀▀═╝  ╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
                     - Website is served on http://localhost:${port}
                     - Run terminal inside container with: \`docker exec -it querybook_web_1 bash\`
                     - Stop the containers with \`ctrl+c\` or run \`make bundled_off\`
                                `);
                });
            });
        },
    };

    if (env && env.QUERYBOOK_COOKIE) {
        for (const proxyPath in settings.proxy) {
            settings.proxy[proxyPath]['headers'] = {
                Cookie: env.QUERYBOOK_COOKIE,
            };
        }
    }

    return settings;
}

module.exports = (env, options) => {
    const PROD = ((env && env.NODE_ENV) || options.mode) === 'production';
    const mode = PROD ? 'production' : 'development';

    const entry = {
        react_hot_loader: 'react-hot-loader/patch',
        react_app: './querybook/webapp/index.tsx',
        vendor: './querybook/webapp/vendor.tsx',
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

    const customScriptPath = !!process.env.QUERYBOOK_PLUGIN
        ? path.resolve(
              process.env.QUERYBOOK_PLUGIN,
              './webpage_plugin/custom_script.ts'
          )
        : null;
    if (customScriptPath != null && fs.existsSync(customScriptPath)) {
        entry.custom = customScriptPath;
    }

    const appName = process.env.QUERYBOOK_APPNAME || 'Querybook';
    const devServer = process.env.WEBPACK_DEV_SERVER
        ? getDevServerSettings(env)
        : {};

    return {
        entry,
        mode,

        devServer,

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
                    use: {
                        loader: 'babel-loader',
                        options: {
                            envName: mode,
                        },
                    },
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
                                sassOptions: {
                                    includePaths: ['node_modules'],
                                },
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
                    include: path.resolve(__dirname, 'querybook/config'),
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
            new webpack.DefinePlugin({
                __VERSION__: JSON.stringify(require('./package.json').version),
                __APPNAME__: JSON.stringify(appName),
            }),
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
                title: appName,
                template: './querybook/webapp/index.html',
                chunks: ['react_hot_loader', 'vendor']
                    .concat(entry.custom ? ['custom'] : [])
                    .concat(['react_app']),
                chunksSortMode: 'manual',
            }),
            new webpack.SourceMapDevToolPlugin({
                filename: '[name].js.map',
                exclude: [/vendor/],
            }),
        ],
    };
};
