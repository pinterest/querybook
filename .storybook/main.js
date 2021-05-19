const webpackFinal = require('./webpack');

module.exports = {
    stories: ['../querybook/webapp/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: ['@storybook/addon-essentials', './theme-addon/preset.js'],
    webpackFinal,
    core: {
        builder: 'webpack5',
    },
};
