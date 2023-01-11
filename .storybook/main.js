const webpackFinal = require('./webpack');

module.exports = {
    stories: ['../querybook/webapp/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: ['@storybook/addon-essentials', './theme-addon/preset.js'],
    webpackFinal,
    core: {
        builder: 'webpack5',
    },
    // https://github.com/pmmmwh/react-refresh-webpack-plugin/issues/176#issuecomment-768238380
    reactOptions: {
        fastRefresh: true,
    },
};
