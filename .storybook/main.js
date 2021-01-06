const webpackFinal = require('./webpack');

module.exports = {
    stories: ['../datahub/webapp/**/*.stories.@(js|jsx|ts|tsx)'],
    addons: ['@storybook/addon-essentials', './theme-addon/preset.js'],
    webpackFinal,
};
