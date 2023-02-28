const config = {
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            '<rootDir>/__mocks__/fileMock.js',
        '.*\\.(css|less|scss)$': '<rootDir>/__mocks__/styleMock.js',
        'config/color_palette.yaml': '<rootDir>/../config/color_palette.yaml',
    },
    moduleDirectories: [
        'node_modules', // This is required
    ],
    setupFiles: ['<rootDir>/__tests__/setup/setup.js'],
    testPathIgnorePatterns: ['<rootDir>/__tests__/setup/'],
    rootDir: './querybook/webapp/',
    modulePaths: ['<rootDir>'],
    globalSetup: '<rootDir>/__tests__/setup/jest-global-setup.js',
    globals: {
        __VERSION__: '1.0.0',
        __APPNAME__: 'Querybook',
        __ENVIRONMENT__: 'production',
    },
    transformIgnorePatterns: [],
    transform: {
        '^.+\\.(jsx|js|ts|tsx)$': 'babel-jest',
        '\\.m?js?$': 'jest-esm-transformer',
        '\\.(yaml|yml)$': '<rootDir>/jest/yaml-transformer.js',
    },
};

module.exports = config;
