const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin').CleanWebpackPlugin;

const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const BUILD_DIR = 'dist/webapp';
const OUTPUT_PATH = path.resolve(__dirname, BUILD_DIR);

function getDevServerSettings(env) {
    const QUERYBOOK_UPSTREAM = env && env.QUERYBOOK_UPSTREAM;
    if (!QUERYBOOK_UPSTREAM) {
        throw Error('Upstream API server is required for this to work');
    }

    const settings = {
        contentBase: OUTPUT_PATH,
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
            '/oauth2callback': {
                target: QUERYBOOK_UPSTREAM,
                changeOrigin: true,
            },
        },
        publicPath: '/build/',
        onListening: (server) => {
            let firstTimeBuildComplete = true;
            const port = server.listeningApp.address().port;
            server.compiler.hooks.done.tap('done', () => {
                if (!firstTimeBuildComplete) {
                    return;
                }
                firstTimeBuildComplete = false;
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
                     - Run terminal inside container with: \`docker exec -it querybook_web bash\`
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
        react_app: './querybook/webapp/index.tsx',
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
    const devServer = env.WEBPACK_SERVE ? getDevServerSettings(env) : {};

    return {
        entry,
        mode,

        devServer,
        output: {
            filename: '[name].[fullhash].js',
            path: OUTPUT_PATH,
            publicPath: '/build/',
            clean: true,
        },

        resolve: {
            // Add '.ts' and '.tsx' as resolvable extensions.

            extensions: ['.ts', '.tsx', '.js', '.json', '.scss`'],

            // emulate baseUrl + paths behavior in tsConfig until tsconfig path plugin is fixed
            modules: [
                path.resolve(__dirname, './querybook/webapp/'),
                'node_modules',
            ],
            alias: {
                config: path.resolve(__dirname, './querybook/config/'),
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
                                postcssOptions: {
                                    ident: 'postcss',
                                    plugins: [
                                        [
                                            'postcss-preset-env',
                                            {
                                                // Options for Postcss-Present-env
                                            },
                                        ],
                                    ],
                                },
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
                    use: 'yaml-loader',
                },
                {
                    test: /\.md$/i,
                    type: 'asset/source',
                },
            ],
        },

        optimization: {
            runtimeChunk: 'single',
            splitChunks: {
                chunks: 'all',
            },
        },

        ...devTool,
        ...watchOptions,

        plugins: [
            new CleanWebpackPlugin(),
            new webpack.DefinePlugin({
                __VERSION__: JSON.stringify(require('./package.json').version),
                __APPNAME__: JSON.stringify(appName),
                __ENVIRONMENT__: JSON.stringify(mode)
            }),
            new webpack.IgnorePlugin({
                resourceRegExp: /^\.\/locale$/,
                contextRegExp: /moment$/,
            }),
            new MiniCssExtractPlugin({
                filename: '[name].[contenthash].css',
            }),
            new HtmlWebpackPlugin({
                title: appName,
                template: './querybook/webapp/index.html',
                chunks: (entry.custom ? ['custom'] : []).concat(['react_app']),
                chunksSortMode: 'manual',
            }),
            new webpack.SourceMapDevToolPlugin({
                filename: '[file].map[query]',
                exclude: [/vendor/],
            }),
            !PROD &&
                new ReactRefreshWebpackPlugin({
                    overlay: false,
                }),
        ].filter(Boolean),
    };
};
